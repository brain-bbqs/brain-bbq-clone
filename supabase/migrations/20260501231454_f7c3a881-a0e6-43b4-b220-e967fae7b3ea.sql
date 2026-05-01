-- Helper: does _editor share a grant with _target investigator?
CREATE OR REPLACE FUNCTION public.user_shares_grant_with_investigator(_editor_id uuid, _target_investigator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.grant_investigators gi_editor
    JOIN public.investigators i_editor ON i_editor.id = gi_editor.investigator_id
    JOIN public.grant_investigators gi_target ON gi_target.grant_id = gi_editor.grant_id
    WHERE i_editor.user_id = _editor_id
      AND gi_target.investigator_id = _target_investigator_id
  )
$$;

-- Replace the investigator UPDATE policy to also allow grant collaborators
DROP POLICY IF EXISTS "Owners admins and curators can update investigators" ON public.investigators;

CREATE POLICY "Owners collaborators and curators can update investigators"
ON public.investigators
FOR UPDATE
TO authenticated
USING (
  user_owns_investigator(auth.uid(), id)
  OR is_curator_or_admin(auth.uid())
  OR user_shares_grant_with_investigator(auth.uid(), id)
)
WITH CHECK (
  user_owns_investigator(auth.uid(), id)
  OR is_curator_or_admin(auth.uid())
  OR user_shares_grant_with_investigator(auth.uid(), id)
);