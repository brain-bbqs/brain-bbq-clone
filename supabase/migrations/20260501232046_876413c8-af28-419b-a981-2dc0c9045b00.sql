-- Allow owners, curators/admins, and grant collaborators to manage investigator_organizations
CREATE POLICY "Owners collaborators and curators can insert investigator orgs"
ON public.investigator_organizations
FOR INSERT
TO authenticated
WITH CHECK (
  user_owns_investigator(auth.uid(), investigator_id)
  OR is_curator_or_admin(auth.uid())
  OR user_shares_grant_with_investigator(auth.uid(), investigator_id)
);

CREATE POLICY "Owners collaborators and curators can delete investigator orgs"
ON public.investigator_organizations
FOR DELETE
TO authenticated
USING (
  user_owns_investigator(auth.uid(), investigator_id)
  OR is_curator_or_admin(auth.uid())
  OR user_shares_grant_with_investigator(auth.uid(), investigator_id)
);