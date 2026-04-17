-- =========================================================================
-- 1. RLS for grant_investigators: project members manage their own roster
-- =========================================================================
ALTER TABLE public.grant_investigators ENABLE ROW LEVEL SECURITY;

-- Helper: can the user edit the roster for this grant_id?
CREATE OR REPLACE FUNCTION public.user_can_edit_grant_roster(_user_id uuid, _grant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.grants g
    WHERE g.id = _grant_id
      AND public.user_can_edit_project(_user_id, g.grant_number)
  )
$$;

DROP POLICY IF EXISTS "Project editors can add team members" ON public.grant_investigators;
CREATE POLICY "Project editors can add team members"
ON public.grant_investigators FOR INSERT TO authenticated
WITH CHECK (public.user_can_edit_grant_roster(auth.uid(), grant_id));

DROP POLICY IF EXISTS "Project editors can update team member roles" ON public.grant_investigators;
CREATE POLICY "Project editors can update team member roles"
ON public.grant_investigators FOR UPDATE TO authenticated
USING (public.user_can_edit_grant_roster(auth.uid(), grant_id))
WITH CHECK (public.user_can_edit_grant_roster(auth.uid(), grant_id));

DROP POLICY IF EXISTS "Project editors can remove team members" ON public.grant_investigators;
CREATE POLICY "Project editors can remove team members"
ON public.grant_investigators FOR DELETE TO authenticated
USING (public.user_can_edit_grant_roster(auth.uid(), grant_id));

-- =========================================================================
-- 2. pending_changes: assistant-proposed diffs awaiting human approval
-- =========================================================================
CREATE TABLE public.pending_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_number text NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  proposed_value jsonb,
  current_value jsonb,
  source text NOT NULL DEFAULT 'assistant',  -- 'assistant' | 'voice' | 'import'
  proposed_by uuid REFERENCES auth.users(id),
  proposed_by_email text,
  rationale text,
  status text NOT NULL DEFAULT 'pending',     -- 'pending' | 'accepted' | 'rejected'
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pending_changes_grant ON public.pending_changes(grant_number, status);
CREATE INDEX idx_pending_changes_project ON public.pending_changes(project_id, status);

ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can VIEW pending changes (transparency for the consortium)
CREATE POLICY "Authenticated can view pending changes"
ON public.pending_changes FOR SELECT TO authenticated
USING (true);

-- Project editors + the assistant (via service role) can INSERT
CREATE POLICY "Project editors can propose changes"
ON public.pending_changes FOR INSERT TO authenticated
WITH CHECK (public.user_can_edit_project(auth.uid(), grant_number));

CREATE POLICY "Service role can propose changes"
ON public.pending_changes FOR INSERT TO service_role
WITH CHECK (true);

-- Only project editors can accept/reject (UPDATE)
CREATE POLICY "Project editors can review pending changes"
ON public.pending_changes FOR UPDATE TO authenticated
USING (public.user_can_edit_project(auth.uid(), grant_number))
WITH CHECK (public.user_can_edit_project(auth.uid(), grant_number));

-- Project editors can dismiss (DELETE) their own grant's pending changes
CREATE POLICY "Project editors can dismiss pending changes"
ON public.pending_changes FOR DELETE TO authenticated
USING (public.user_can_edit_project(auth.uid(), grant_number));

-- Auto-update updated_at
CREATE TRIGGER update_pending_changes_updated_at
BEFORE UPDATE ON public.pending_changes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 3. Helper: accept a pending change (writes to projects.metadata + edit_history)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.accept_pending_change(_change_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _change record;
  _user_email text;
  _new_metadata jsonb;
BEGIN
  -- Load the change
  SELECT * INTO _change FROM public.pending_changes WHERE id = _change_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending change % not found', _change_id;
  END IF;
  IF _change.status <> 'pending' THEN
    RAISE EXCEPTION 'Change % already %', _change_id, _change.status;
  END IF;

  -- Permission check
  IF NOT public.user_can_edit_project(auth.uid(), _change.grant_number) THEN
    RAISE EXCEPTION 'Not authorized to accept changes for grant %', _change.grant_number;
  END IF;

  SELECT email INTO _user_email FROM public.profiles WHERE id = auth.uid();

  -- Top-level columns vs metadata JSONB
  IF _change.field_name IN ('study_species','study_human','keywords','website') THEN
    EXECUTE format(
      'UPDATE public.projects SET %I = $1, last_edited_by = $2 WHERE grant_number = $3',
      _change.field_name
    ) USING (_change.proposed_value #>> '{}')::text, COALESCE(_user_email,'unknown'), _change.grant_number;
  ELSE
    UPDATE public.projects
       SET metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(_change.field_name, _change.proposed_value),
           last_edited_by = COALESCE(_user_email,'unknown')
     WHERE grant_number = _change.grant_number;
  END IF;

  -- Audit
  INSERT INTO public.edit_history (grant_number, project_id, field_name, old_value, new_value, edited_by, validation_status, chat_context)
  VALUES (
    _change.grant_number, _change.project_id, _change.field_name,
    _change.current_value, _change.proposed_value,
    COALESCE(_user_email,'unknown'),
    'accepted_from_assistant',
    jsonb_build_object('pending_change_id', _change_id, 'rationale', _change.rationale, 'conversation_id', _change.conversation_id)
  );

  -- Mark accepted
  UPDATE public.pending_changes
     SET status = 'accepted', reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _change_id;

  RETURN jsonb_build_object('ok', true, 'field', _change.field_name);
END;
$$;