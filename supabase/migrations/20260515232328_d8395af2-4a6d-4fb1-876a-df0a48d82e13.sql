
-- 1. Flip investigators_public from SECURITY DEFINER to SECURITY INVOKER
ALTER VIEW public.investigators_public SET (security_invoker = true);

-- 2. Lock down analytics_pageviews / analytics_clicks SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can view pageviews" ON public.analytics_pageviews;
CREATE POLICY "Admins can view pageviews"
  ON public.analytics_pageviews
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view clicks" ON public.analytics_clicks;
CREATE POLICY "Admins can view clicks"
  ON public.analytics_clicks
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Lock down search_queries SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can view search queries" ON public.search_queries;
CREATE POLICY "Admins can view search queries"
  ON public.search_queries
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
