-- Create table to cache NIH grant data
CREATE TABLE public.nih_grants_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grant_number text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nih_grants_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public research data)
CREATE POLICY "Anyone can view cached grants"
  ON public.nih_grants_cache
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (via edge function)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated users

-- Create index for fast lookups
CREATE INDEX idx_nih_grants_cache_grant_number ON public.nih_grants_cache (grant_number);

-- Add a metadata row to track last refresh time
CREATE TABLE public.nih_grants_sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  grants_updated integer DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  error_message text
);

ALTER TABLE public.nih_grants_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sync log"
  ON public.nih_grants_sync_log
  FOR SELECT
  USING (true);