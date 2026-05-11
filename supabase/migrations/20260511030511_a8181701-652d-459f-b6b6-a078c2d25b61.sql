-- 1) Investigators: restrict authenticated SELECT to admins/curators, self, and grant collaborators.
--    Other authenticated reads should use the existing investigators_public view.
DROP POLICY IF EXISTS "Authenticated users can view investigators" ON public.investigators;
CREATE POLICY "Restricted view of investigators"
  ON public.investigators FOR SELECT
  TO authenticated
  USING (
    public.is_curator_or_admin(auth.uid())
    OR user_id = auth.uid()
    OR public.user_shares_grant_with_investigator(auth.uid(), id)
  );

-- 2) Jobs: tighten public SELECT to authenticated only. Anonymous users use public_jobs view.
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;
CREATE POLICY "Authenticated users can view active jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3) Projects.last_edited_by: scrub email addresses; future writes will store user UUID strings.
UPDATE public.projects
   SET last_edited_by = NULL
 WHERE last_edited_by ~ '@';

-- Update revert_curation_change to write actor_id as text instead of email.
CREATE OR REPLACE FUNCTION public.revert_curation_change(_audit_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _row     public.curation_audit_log%ROWTYPE;
  _editor  text;
  _new_id  uuid;
BEGIN
  SELECT * INTO _row FROM public.curation_audit_log WHERE id = _audit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Audit row % not found', _audit_id; END IF;
  IF _row.reverted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Audit row % already reverted at %', _audit_id, _row.reverted_at;
  END IF;
  IF NOT public.user_can_revert_audit(auth.uid(), _audit_id) THEN
    RAISE EXCEPTION 'Not authorized to revert this change';
  END IF;

  _editor := COALESCE(auth.uid()::text, 'reverted');

  CASE _row.entity_type
    WHEN 'project_metadata' THEN
      IF _row.grant_number IS NULL OR _row.field_name IS NULL THEN
        RAISE EXCEPTION 'project_metadata audit row missing grant_number or field_name';
      END IF;
      IF _row.field_name IN ('study_species','study_human','keywords','website') THEN
        EXECUTE format(
          'UPDATE public.projects SET %I = $1, last_edited_by = $2, updated_at = now() WHERE grant_number = $3',
          _row.field_name
        ) USING (_row.before_value #>> '{}'), _editor, _row.grant_number;
      ELSE
        IF _row.before_value IS NULL OR _row.before_value = 'null'::jsonb THEN
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb) - _row.field_name,
                 last_edited_by = _editor,
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        ELSE
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb)
                          || jsonb_build_object(_row.field_name, _row.before_value),
                 last_edited_by = _editor,
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        END IF;
      END IF;

    WHEN 'team_roster' THEN
      IF _row.action = 'create' THEN
        DELETE FROM public.grant_investigators
         WHERE grant_id = (_row.after_value->>'grant_id')::uuid
           AND investigator_id = (_row.after_value->>'investigator_id')::uuid;
      ELSIF _row.action = 'delete' THEN
        INSERT INTO public.grant_investigators(grant_id, investigator_id, role)
        VALUES (
          (_row.before_value->>'grant_id')::uuid,
          (_row.before_value->>'investigator_id')::uuid,
          COALESCE(_row.before_value->>'role','co_pi')
        ) ON CONFLICT DO NOTHING;
      ELSE
        UPDATE public.grant_investigators
           SET role = COALESCE(_row.before_value->>'role','co_pi')
         WHERE grant_id = (_row.after_value->>'grant_id')::uuid
           AND investigator_id = (_row.after_value->>'investigator_id')::uuid;
      END IF;

    WHEN 'pending_change_decision' THEN
      IF _row.grant_number IS NULL OR _row.field_name IS NULL THEN
        RAISE EXCEPTION 'pending_change_decision audit missing grant_number or field_name';
      END IF;
      IF _row.field_name IN ('study_species','study_human','keywords','website') THEN
        EXECUTE format(
          'UPDATE public.projects SET %I = $1, last_edited_by = $2, updated_at = now() WHERE grant_number = $3',
          _row.field_name
        ) USING (_row.before_value #>> '{}'), _editor, _row.grant_number;
      ELSE
        IF _row.before_value IS NULL OR _row.before_value = 'null'::jsonb THEN
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb) - _row.field_name,
                 last_edited_by = _editor,
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        ELSE
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb)
                          || jsonb_build_object(_row.field_name, _row.before_value),
                 last_edited_by = _editor,
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        END IF;
      END IF;

    WHEN 'investigator' THEN
      IF _row.investigator_id IS NULL OR _row.field_name IS NULL THEN
        RAISE EXCEPTION 'investigator audit missing investigator_id or field_name';
      END IF;
      EXECUTE format(
        'UPDATE public.investigators SET %I = $1, updated_at = now() WHERE id = $2',
        _row.field_name
      ) USING (_row.before_value #>> '{}'), _row.investigator_id;

    WHEN 'entity_comment' THEN
      IF _row.action = 'create' THEN
        DELETE FROM public.entity_comments WHERE id = _row.entity_id;
      ELSIF _row.action = 'delete' THEN
        INSERT INTO public.entity_comments(id, resource_id, user_id, parent_id, content, created_at, updated_at)
        VALUES (
          _row.entity_id,
          (_row.before_value->>'resource_id')::uuid,
          (_row.before_value->>'user_id')::uuid,
          NULLIF(_row.before_value->>'parent_id','')::uuid,
          _row.before_value->>'content',
          COALESCE((_row.before_value->>'created_at')::timestamptz, now()),
          now()
        ) ON CONFLICT (id) DO NOTHING;
      ELSE
        UPDATE public.entity_comments
           SET content = _row.before_value->>'content',
               updated_at = now()
         WHERE id = _row.entity_id;
      END IF;
  END CASE;

  UPDATE public.curation_audit_log
     SET reverted_at = now(),
         reverted_by = auth.uid()
   WHERE id = _audit_id;

  INSERT INTO public.curation_audit_log(
    entity_type, action, entity_id, grant_number, resource_id, project_id, investigator_id,
    field_name, before_value, after_value,
    actor_id, source,
    is_revert, reverted_from_audit_id
  ) VALUES (
    _row.entity_type, _row.action, _row.entity_id, _row.grant_number, _row.resource_id, _row.project_id, _row.investigator_id,
    _row.field_name,
    _row.after_value,
    _row.before_value,
    auth.uid(), 'revert',
    true, _audit_id
  ) RETURNING id INTO _new_id;

  RETURN jsonb_build_object('ok', true, 'revert_audit_id', _new_id, 'reverted', _audit_id);
END;
$function$;

-- 4) Drop actor_email column from curation_audit_log (PII de-duplication; join to profiles by actor_id).
ALTER TABLE public.curation_audit_log DROP COLUMN IF EXISTS actor_email;

-- 5) paper-uploads bucket: add explicit UPDATE policy mirroring the ownership check.
CREATE POLICY "Users can update own paper uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'paper-uploads' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'paper-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6) feature_suggestions.votes: prevent direct manipulation via authenticated UPDATE.
--    Vote tallies are written via SECURITY DEFINER RPCs which bypass this trigger.
CREATE OR REPLACE FUNCTION public.enforce_feature_votes_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.votes IS DISTINCT FROM OLD.votes THEN
    RAISE EXCEPTION 'votes column cannot be modified directly; use feature_votes table';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feature_suggestions_votes_immutable ON public.feature_suggestions;
CREATE TRIGGER feature_suggestions_votes_immutable
  BEFORE UPDATE ON public.feature_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_feature_votes_immutable();

-- Make the increment/decrement RPCs SECURITY DEFINER so they bypass the trigger via direct SQL.
-- We instead update votes in those functions using a session-local flag check.
CREATE OR REPLACE FUNCTION public.increment_vote_count(_suggestion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Bypass the immutability trigger by updating directly with a recomputed value
  -- via a SECURITY DEFINER context; the trigger still fires, so we disable it temporarily
  -- per-statement using session_replication_role.
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.feature_suggestions SET votes = votes + 1 WHERE id = _suggestion_id;
  PERFORM set_config('session_replication_role', 'origin', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_vote_count(_suggestion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.feature_suggestions SET votes = GREATEST(votes - 1, 0) WHERE id = _suggestion_id;
  PERFORM set_config('session_replication_role', 'origin', true);
END;
$$;