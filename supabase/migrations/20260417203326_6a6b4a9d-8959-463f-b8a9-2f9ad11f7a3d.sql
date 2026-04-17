CREATE OR REPLACE FUNCTION public.is_curator_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'curator')
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_project(_user_id uuid, _grant_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_curator_or_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.grant_investigators gi
      JOIN public.grants g ON g.id = gi.grant_id
      JOIN public.investigators i ON i.id = gi.investigator_id
      WHERE g.grant_number = _grant_number
        AND i.user_id = _user_id
    )
$$;