-- =========================================================================
-- Curation audit log + universal revert function
-- =========================================================================

CREATE TYPE public.curation_entity_type AS ENUM (
  'project_metadata',
  'team_roster',
  'pending_change_decision',
  'investigator',
  'entity_comment'
);

CREATE TYPE public.curation_action AS ENUM ('create', 'update', 'delete');

CREATE TABLE public.curation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  entity_type public.curation_entity_type NOT NULL,
  action public.curation_action NOT NULL,

  -- Primary key of the affected row in its source table (nullable for delete-of-deleted-row edge cases)
  entity_id UUID,

  -- Scoping for permission checks
  grant_number TEXT,
  resource_id  UUID,
  project_id   UUID,
  investigator_id UUID,

  -- For project_metadata edits: which field changed
  field_name TEXT,

  -- Exact snapshots so revert is deterministic
  before_value JSONB,
  after_value  JSONB,

  -- Who did it
  actor_id    UUID,
  actor_email TEXT,
  source      TEXT NOT NULL DEFAULT 'manual', -- 'metadata_chat' | 'manual' | 'pending_change' | etc.

  -- Revert tracking
  reverted_at              TIMESTAMPTZ,
  reverted_by              UUID,
  reverted_from_audit_id   UUID REFERENCES public.curation_audit_log(id) ON DELETE SET NULL,
  is_revert                BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cal_grant_number ON public.curation_audit_log(grant_number) WHERE grant_number IS NOT NULL;
CREATE INDEX idx_cal_resource_id  ON public.curation_audit_log(resource_id)  WHERE resource_id IS NOT NULL;
CREATE INDEX idx_cal_investigator ON public.curation_audit_log(investigator_id) WHERE investigator_id IS NOT NULL;
CREATE INDEX idx_cal_entity       ON public.curation_audit_log(entity_type, entity_id);
CREATE INDEX idx_cal_actor        ON public.curation_audit_log(actor_id, created_at DESC);
CREATE INDEX idx_cal_created_at   ON public.curation_audit_log(created_at DESC);
CREATE INDEX idx_cal_unreverted   ON public.curation_audit_log(reverted_at) WHERE reverted_at IS NULL;

ALTER TABLE public.curation_audit_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read full audit log (transparency)
CREATE POLICY "Authenticated can view curation audit log"
  ON public.curation_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserts via service role (edge functions) and via the revert RPC (security definer)
CREATE POLICY "Service role can insert audit rows"
  ON public.curation_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users may insert their own rows (used by client-side curation flows)
CREATE POLICY "Authenticated can insert own audit rows"
  ON public.curation_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Updates only via revert RPC (security definer bypasses RLS) — no general policy

-- =========================================================================
-- Permission helper: can current user revert a given audit row?
-- =========================================================================
CREATE OR REPLACE FUNCTION public.user_can_revert_audit(_user_id uuid, _audit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.curation_audit_log%ROWTYPE;
BEGIN
  SELECT * INTO _row FROM public.curation_audit_log WHERE id = _audit_id;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Admins/curators can revert anything
  IF public.is_curator_or_admin(_user_id) THEN RETURN true; END IF;

  CASE _row.entity_type
    WHEN 'project_metadata', 'pending_change_decision' THEN
      RETURN _row.grant_number IS NOT NULL
         AND public.user_can_edit_project(_user_id, _row.grant_number);

    WHEN 'team_roster' THEN
      RETURN _row.grant_number IS NOT NULL
         AND public.user_can_edit_project(_user_id, _row.grant_number);

    WHEN 'investigator' THEN
      RETURN _row.investigator_id IS NOT NULL
         AND public.user_owns_investigator(_user_id, _row.investigator_id);

    WHEN 'entity_comment' THEN
      -- Comment author or admin
      RETURN _row.actor_id = _user_id;

    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- =========================================================================
-- Universal revert RPC
-- =========================================================================
CREATE OR REPLACE FUNCTION public.revert_curation_change(_audit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row     public.curation_audit_log%ROWTYPE;
  _email   text;
  _new_id  uuid;
  _project_row public.projects%ROWTYPE;
BEGIN
  -- Load original audit row
  SELECT * INTO _row FROM public.curation_audit_log WHERE id = _audit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit row % not found', _audit_id;
  END IF;
  IF _row.reverted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Audit row % already reverted at %', _audit_id, _row.reverted_at;
  END IF;

  -- Permission gate
  IF NOT public.user_can_revert_audit(auth.uid(), _audit_id) THEN
    RAISE EXCEPTION 'Not authorized to revert this change';
  END IF;

  SELECT email INTO _email FROM public.profiles WHERE id = auth.uid();

  -- ====== Apply inverse based on entity type ======
  CASE _row.entity_type

    -- ---- PROJECT METADATA (field-level) -----------------------------
    WHEN 'project_metadata' THEN
      IF _row.grant_number IS NULL OR _row.field_name IS NULL THEN
        RAISE EXCEPTION 'project_metadata audit row missing grant_number or field_name';
      END IF;

      IF _row.field_name IN ('study_species','study_human','keywords','website') THEN
        EXECUTE format(
          'UPDATE public.projects SET %I = $1, last_edited_by = $2, updated_at = now() WHERE grant_number = $3',
          _row.field_name
        ) USING (_row.before_value #>> '{}'), COALESCE(_email,'reverted'), _row.grant_number;
      ELSE
        IF _row.before_value IS NULL OR _row.before_value = 'null'::jsonb THEN
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb) - _row.field_name,
                 last_edited_by = COALESCE(_email,'reverted'),
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        ELSE
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb)
                          || jsonb_build_object(_row.field_name, _row.before_value),
                 last_edited_by = COALESCE(_email,'reverted'),
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        END IF;
      END IF;

    -- ---- TEAM ROSTER (grant_investigators) --------------------------
    WHEN 'team_roster' THEN
      -- before_value/after_value shape: { "grant_id": uuid, "investigator_id": uuid, "role": text }
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
        )
        ON CONFLICT DO NOTHING;
      ELSE -- update (role change)
        UPDATE public.grant_investigators
           SET role = COALESCE(_row.before_value->>'role','co_pi')
         WHERE grant_id = (_row.after_value->>'grant_id')::uuid
           AND investigator_id = (_row.after_value->>'investigator_id')::uuid;
      END IF;

    -- ---- PENDING CHANGE DECISION ------------------------------------
    -- Reverts the project field touched by an accept_pending_change call.
    -- before_value/after_value mirror the field-level diff snapshot.
    WHEN 'pending_change_decision' THEN
      IF _row.grant_number IS NULL OR _row.field_name IS NULL THEN
        RAISE EXCEPTION 'pending_change_decision audit missing grant_number or field_name';
      END IF;
      IF _row.field_name IN ('study_species','study_human','keywords','website') THEN
        EXECUTE format(
          'UPDATE public.projects SET %I = $1, last_edited_by = $2, updated_at = now() WHERE grant_number = $3',
          _row.field_name
        ) USING (_row.before_value #>> '{}'), COALESCE(_email,'reverted'), _row.grant_number;
      ELSE
        IF _row.before_value IS NULL OR _row.before_value = 'null'::jsonb THEN
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb) - _row.field_name,
                 last_edited_by = COALESCE(_email,'reverted'),
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        ELSE
          UPDATE public.projects
             SET metadata = COALESCE(metadata,'{}'::jsonb)
                          || jsonb_build_object(_row.field_name, _row.before_value),
                 last_edited_by = COALESCE(_email,'reverted'),
                 updated_at = now()
           WHERE grant_number = _row.grant_number;
        END IF;
      END IF;

    -- ---- INVESTIGATOR PROFILE (field-level update only) -------------
    WHEN 'investigator' THEN
      IF _row.investigator_id IS NULL OR _row.field_name IS NULL THEN
        RAISE EXCEPTION 'investigator audit missing investigator_id or field_name';
      END IF;
      EXECUTE format(
        'UPDATE public.investigators SET %I = $1, updated_at = now() WHERE id = $2',
        _row.field_name
      ) USING (_row.before_value #>> '{}'), _row.investigator_id;

    -- ---- ENTITY COMMENT --------------------------------------------
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
        )
        ON CONFLICT (id) DO NOTHING;
      ELSE -- update (content edit)
        UPDATE public.entity_comments
           SET content = _row.before_value->>'content',
               updated_at = now()
         WHERE id = _row.entity_id;
      END IF;

  END CASE;

  -- ====== Mark original as reverted ======
  UPDATE public.curation_audit_log
     SET reverted_at = now(),
         reverted_by = auth.uid()
   WHERE id = _audit_id;

  -- ====== Log the revert as its own audit row (so undo-of-undo works) ======
  INSERT INTO public.curation_audit_log(
    entity_type, action, entity_id, grant_number, resource_id, project_id, investigator_id,
    field_name, before_value, after_value,
    actor_id, actor_email, source,
    is_revert, reverted_from_audit_id
  ) VALUES (
    _row.entity_type, _row.action, _row.entity_id, _row.grant_number, _row.resource_id, _row.project_id, _row.investigator_id,
    _row.field_name,
    _row.after_value,   -- inverse: what we just undid is the new "before"
    _row.before_value,  -- and the restored value is the new "after"
    auth.uid(), COALESCE(_email,'unknown'), 'revert',
    true, _audit_id
  ) RETURNING id INTO _new_id;

  RETURN jsonb_build_object('ok', true, 'revert_audit_id', _new_id, 'reverted', _audit_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revert_curation_change(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_revert_audit(uuid, uuid) TO authenticated;