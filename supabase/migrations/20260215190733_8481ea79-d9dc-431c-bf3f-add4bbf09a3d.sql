
-- Analytics: page views
CREATE TABLE public.analytics_pageviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  referrer text,
  user_agent text,
  session_id text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Analytics: click events
CREATE TABLE public.analytics_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  element_tag text,
  element_text text,
  element_href text,
  section text,
  session_id text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (tracking should work for all visitors)
CREATE POLICY "Anyone can insert pageviews"
  ON public.analytics_pageviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert clicks"
  ON public.analytics_clicks FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read analytics (for admin dashboards later)
CREATE POLICY "Authenticated users can view pageviews"
  ON public.analytics_pageviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view clicks"
  ON public.analytics_clicks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Indexes for querying
CREATE INDEX idx_pageviews_path ON public.analytics_pageviews(path);
CREATE INDEX idx_pageviews_created ON public.analytics_pageviews(created_at);
CREATE INDEX idx_clicks_path ON public.analytics_clicks(path);
CREATE INDEX idx_clicks_created ON public.analytics_clicks(created_at);
