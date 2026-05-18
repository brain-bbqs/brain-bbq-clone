CREATE POLICY "Curators and admins can insert funding opportunities"
ON public.funding_opportunities
FOR INSERT
TO authenticated
WITH CHECK (is_curator_or_admin(auth.uid()));

CREATE POLICY "Curators and admins can update funding opportunities"
ON public.funding_opportunities
FOR UPDATE
TO authenticated
USING (is_curator_or_admin(auth.uid()))
WITH CHECK (is_curator_or_admin(auth.uid()));

CREATE POLICY "Curators and admins can delete funding opportunities"
ON public.funding_opportunities
FOR DELETE
TO authenticated
USING (is_curator_or_admin(auth.uid()));