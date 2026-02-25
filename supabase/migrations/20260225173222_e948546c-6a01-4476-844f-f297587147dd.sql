
-- Update user_can_edit_project to grant MIT users full edit access
CREATE OR REPLACE FUNCTION public.user_can_edit_project(_user_id uuid, _grant_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- MIT users can edit everything
    SELECT 1
    FROM public.profiles p
    JOIN public.allowed_domains ad ON ad.organization_id = p.organization_id
    WHERE p.id = _user_id
      AND ad.domain = 'mit.edu'
  )
  OR EXISTS (
    -- Other users: same org as project investigators
    SELECT 1
    FROM public.profiles p
    JOIN public.investigator_organizations io ON io.organization_id = p.organization_id
    JOIN public.grant_investigators gi ON gi.investigator_id = io.investigator_id
    WHERE p.id = _user_id
      AND gi.grant_number = _grant_number
  )
$$;
