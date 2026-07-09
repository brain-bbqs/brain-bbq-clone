GRANT INSERT ON public.analytics_pageviews TO anon;
GRANT INSERT ON public.analytics_clicks TO anon;

DROP POLICY IF EXISTS "Anonymous visitors can insert pageviews" ON public.analytics_pageviews;
CREATE POLICY "Anonymous visitors can insert pageviews"
  ON public.analytics_pageviews
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Anonymous visitors can insert clicks" ON public.analytics_clicks;
CREATE POLICY "Anonymous visitors can insert clicks"
  ON public.analytics_clicks
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);