
CREATE TABLE public.grant_methods_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seed_grant_number TEXT NOT NULL,
  source_grant_number TEXT NOT NULL,
  source_grant_title TEXT,
  source_org TEXT,
  source_org_type TEXT,
  depth INTEGER NOT NULL DEFAULT 0,
  match_score INTEGER,
  pmid TEXT,
  publication_title TEXT,
  publication_year INTEGER,
  source_url TEXT,
  methods_snippet TEXT,
  device_hardware JSONB DEFAULT '[]'::jsonb,
  stimulation_params JSONB DEFAULT '{}'::jsonb,
  recording_params JSONB DEFAULT '{}'::jsonb,
  analysis_metrics JSONB DEFAULT '[]'::jsonb,
  setting TEXT,
  irb_or_population TEXT,
  quote TEXT,
  confidence NUMERIC,
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seed_grant_number, source_grant_number, pmid)
);

CREATE INDEX idx_gme_seed ON public.grant_methods_evidence(seed_grant_number);
CREATE INDEX idx_gme_pmid ON public.grant_methods_evidence(pmid);

GRANT SELECT ON public.grant_methods_evidence TO anon, authenticated;
GRANT ALL ON public.grant_methods_evidence TO service_role;

ALTER TABLE public.grant_methods_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Methods evidence is public-readable"
  ON public.grant_methods_evidence
  FOR SELECT
  USING (true);

CREATE POLICY "Service role manages methods evidence"
  ON public.grant_methods_evidence
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
