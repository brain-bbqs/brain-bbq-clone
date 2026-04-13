-- Phase 2a: Lock down anonymous writes on projects
DROP POLICY IF EXISTS "Anyone can insert project metadata" ON public.projects;
DROP POLICY IF EXISTS "Anyone can update project metadata" ON public.projects;

CREATE POLICY "Authenticated users can insert project metadata"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can_edit_project(auth.uid(), grant_number));

CREATE POLICY "Authenticated users can update project metadata"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.user_can_edit_project(auth.uid(), grant_number));

-- Phase 2a: Lock down project_publications
DROP POLICY IF EXISTS "Anyone can insert project publications" ON public.project_publications;
DROP POLICY IF EXISTS "Anyone can delete project publications" ON public.project_publications;

CREATE POLICY "Authenticated users can insert project publications"
  ON public.project_publications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project publications"
  ON public.project_publications FOR DELETE
  TO authenticated
  USING (true);

-- Phase 2a: Lock down project_resources
DROP POLICY IF EXISTS "Anyone can insert project resources" ON public.project_resources;
DROP POLICY IF EXISTS "Anyone can delete project resources" ON public.project_resources;

CREATE POLICY "Authenticated users can insert project resources"
  ON public.project_resources FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project resources"
  ON public.project_resources FOR DELETE
  TO authenticated
  USING (true);

-- Phase 2a: Lock down edit_history
DROP POLICY IF EXISTS "Anyone can insert edit history" ON public.edit_history;

CREATE POLICY "Authenticated users can insert edit history"
  ON public.edit_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Phase 2b: Protect PII in profiles — restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Phase 2a: Lock down species
DROP POLICY IF EXISTS "Anyone can insert species" ON public.species;
DROP POLICY IF EXISTS "Anyone can update species" ON public.species;

CREATE POLICY "Authenticated users can insert species"
  ON public.species FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update species"
  ON public.species FOR UPDATE
  TO authenticated
  USING (true);