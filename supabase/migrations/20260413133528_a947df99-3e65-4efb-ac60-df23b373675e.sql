
-- ============================================================
-- CRITICAL FIX 1: Remove unrestricted investigator UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update investigators" ON public.investigators;

-- ============================================================
-- CRITICAL FIX 2: Hide submitted_by_email from anonymous users
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view feature suggestions" ON public.feature_suggestions;
CREATE POLICY "Authenticated users can view feature suggestions"
  ON public.feature_suggestions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- CRITICAL FIX 3: Remove MIT-domain blanket edit access
-- Recreate user_can_edit_project WITHOUT the mit.edu shortcut
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_can_edit_project(_user_id uuid, _grant_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.grant_investigators gi
    JOIN public.grants g ON g.id = gi.grant_id
    JOIN public.investigators i ON i.id = gi.investigator_id
    WHERE g.grant_number = _grant_number
      AND i.user_id = _user_id
  )
$$;

-- ============================================================
-- TIGHTEN: feature_suggestions UPDATE — author only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can update suggestions" ON public.feature_suggestions;
CREATE POLICY "Users can update own suggestions"
  ON public.feature_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = submitted_by);

-- ============================================================
-- TIGHTEN: edit_history INSERT — must match user
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert edit history" ON public.edit_history;
CREATE POLICY "Authenticated users can insert edit history"
  ON public.edit_history FOR INSERT
  TO authenticated
  WITH CHECK (edited_by = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- TIGHTEN: grant_investigators INSERT — service_role only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert grant investigators" ON public.grant_investigators;
CREATE POLICY "Service role can insert grant investigators"
  ON public.grant_investigators FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- TIGHTEN: investigator_organizations INSERT — service_role only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert investigator orgs" ON public.investigator_organizations;
CREATE POLICY "Service role can insert investigator orgs"
  ON public.investigator_organizations FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- TIGHTEN: organizations INSERT — service_role only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;
CREATE POLICY "Service role can insert organizations"
  ON public.organizations FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- TIGHTEN: taxonomies INSERT — authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert taxonomies" ON public.taxonomies;
CREATE POLICY "Authenticated users can insert taxonomies"
  ON public.taxonomies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- TIGHTEN: analytics — authenticated only for inserts
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.analytics_clicks;
CREATE POLICY "Authenticated users can insert clicks"
  ON public.analytics_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert pageviews" ON public.analytics_pageviews;
CREATE POLICY "Authenticated users can insert pageviews"
  ON public.analytics_pageviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- TIGHTEN: custom_field_usage — use authenticated role
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert custom field usage" ON public.custom_field_usage;
CREATE POLICY "Authenticated can insert custom field usage"
  ON public.custom_field_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update custom field usage" ON public.custom_field_usage;
CREATE POLICY "Authenticated can update custom field usage"
  ON public.custom_field_usage FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================
-- TIGHTEN: species UPDATE — authenticated role (already was)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update species" ON public.species;
CREATE POLICY "Authenticated users can update species"
  ON public.species FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================
-- TIGHTEN: funding_opportunities INSERT — service_role only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert funding opportunities" ON public.funding_opportunities;
CREATE POLICY "Service role can insert funding opportunities"
  ON public.funding_opportunities FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- TIGHTEN: project_publications — scope to project editors
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert project publications" ON public.project_publications;
CREATE POLICY "Project editors can insert project publications"
  ON public.project_publications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.user_can_edit_project(auth.uid(), p.grant_number)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can delete project publications" ON public.project_publications;
CREATE POLICY "Project editors can delete project publications"
  ON public.project_publications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.user_can_edit_project(auth.uid(), p.grant_number)
    )
  );

-- ============================================================
-- TIGHTEN: project_resources — scope to project editors
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert project resources" ON public.project_resources;
CREATE POLICY "Project editors can insert project resources"
  ON public.project_resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.user_can_edit_project(auth.uid(), p.grant_number)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can delete project resources" ON public.project_resources;
CREATE POLICY "Project editors can delete project resources"
  ON public.project_resources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.user_can_edit_project(auth.uid(), p.grant_number)
    )
  );

-- ============================================================
-- TIGHTEN: search_queries INSERT — authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert search queries" ON public.search_queries;
CREATE POLICY "Authenticated users can insert search queries"
  ON public.search_queries FOR INSERT
  TO authenticated
  WITH CHECK (true);
