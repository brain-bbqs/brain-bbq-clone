
-- Anonymous search query logging for analytics
CREATE TABLE public.search_queries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query text NOT NULL,
  mode text NOT NULL DEFAULT 'search', -- 'search' or 'chat'
  results_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous logging)
CREATE POLICY "Anyone can insert search queries"
  ON public.search_queries FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read analytics
CREATE POLICY "Authenticated users can view search queries"
  ON public.search_queries FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Index for analytics queries
CREATE INDEX idx_search_queries_created_at ON public.search_queries (created_at DESC);
CREATE INDEX idx_search_queries_mode ON public.search_queries (mode);
