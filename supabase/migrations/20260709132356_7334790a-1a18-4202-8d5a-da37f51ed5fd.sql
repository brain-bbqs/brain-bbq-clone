
DROP POLICY IF EXISTS "Admins can view pageviews" ON public.analytics_pageviews;
DROP POLICY IF EXISTS "Admins can view clicks" ON public.analytics_clicks;
CREATE POLICY "Admins and curators can view pageviews" ON public.analytics_pageviews FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'curator'::app_role));
CREATE POLICY "Admins and curators can view clicks" ON public.analytics_clicks FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'curator'::app_role));
