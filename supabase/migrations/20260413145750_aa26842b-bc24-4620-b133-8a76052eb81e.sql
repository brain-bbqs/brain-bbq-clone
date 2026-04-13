-- Tighten analytics_clicks: user can only insert rows attributed to themselves
DROP POLICY IF EXISTS "Authenticated users can insert clicks" ON public.analytics_clicks;
CREATE POLICY "Authenticated users can insert own clicks"
  ON public.analytics_clicks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Tighten analytics_pageviews: user can only insert rows attributed to themselves
DROP POLICY IF EXISTS "Authenticated users can insert pageviews" ON public.analytics_pageviews;
CREATE POLICY "Authenticated users can insert own pageviews"
  ON public.analytics_pageviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Tighten search_queries: already has no user_id column, so restrict to authenticated only (keep as-is but rename for clarity)
-- search_queries has no user_id, so WITH CHECK (true) is acceptable for authenticated users logging queries
DROP POLICY IF EXISTS "Authenticated users can insert search queries" ON public.search_queries;
CREATE POLICY "Authenticated users can log search queries"
  ON public.search_queries FOR INSERT TO authenticated
  WITH CHECK (true);