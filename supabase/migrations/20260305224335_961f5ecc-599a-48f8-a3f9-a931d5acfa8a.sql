-- Allow users to update their own investigator record (linked via user_id)
CREATE POLICY "Users can update own investigator"
  ON public.investigators FOR UPDATE
  USING (public.user_owns_investigator(auth.uid(), id) OR public.user_can_edit_project(auth.uid(), ''))
  WITH CHECK (public.user_owns_investigator(auth.uid(), id));

-- Allow resource creators to update their own resources  
CREATE POLICY "Users can update own resources"
  ON public.resources FOR UPDATE
  USING (created_by = auth.uid());

-- Allow authenticated users to insert resources (and track ownership)
CREATE POLICY "Authenticated can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to claim an investigator (set user_id to themselves) if unclaimed
-- This is handled via the existing update policy + frontend validation