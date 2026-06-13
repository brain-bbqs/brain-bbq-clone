
-- 1. Facet columns on evidence
ALTER TABLE public.grant_methods_evidence
  ADD COLUMN IF NOT EXISTS species text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS behavior_paradigm text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS device_class text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subject_n integer,
  ADD COLUMN IF NOT EXISTS study_arm text;

CREATE INDEX IF NOT EXISTS idx_gme_device_class ON public.grant_methods_evidence USING gin (device_class);
CREATE INDEX IF NOT EXISTS idx_gme_species      ON public.grant_methods_evidence USING gin (species);
CREATE INDEX IF NOT EXISTS idx_gme_study_arm    ON public.grant_methods_evidence (study_arm);

-- 2. harvester_runs
CREATE TABLE IF NOT EXISTS public.harvester_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_grant text NOT NULL,
  phase text NOT NULL DEFAULT 'queued',           -- queued | scraping | extracting | hopping | done | error
  current_hop integer NOT NULL DEFAULT 0,
  current_target text,                            -- e.g. PMID or URL being processed
  pubs_found integer NOT NULL DEFAULT 0,
  evidence_rows integer NOT NULL DEFAULT 0,
  firecrawl_calls integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  last_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.harvester_runs TO authenticated;
GRANT ALL    ON public.harvester_runs TO service_role;
ALTER TABLE public.harvester_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harvester_runs admin/curator read"
  ON public.harvester_runs FOR SELECT TO authenticated
  USING (public.is_curator_or_admin(auth.uid()));
CREATE TRIGGER trg_harvester_runs_updated
  BEFORE UPDATE ON public.harvester_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_runs_phase   ON public.harvester_runs (phase);
CREATE INDEX IF NOT EXISTS idx_runs_started ON public.harvester_runs (started_at DESC);

-- 3. harvester_queue
CREATE TABLE IF NOT EXISTS public.harvester_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_grant text NOT NULL UNIQUE,
  priority integer NOT NULL DEFAULT 100,          -- lower = sooner
  cool_down_hours integer NOT NULL DEFAULT 72,
  last_run_at timestamptz,
  last_run_id uuid REFERENCES public.harvester_runs(id) ON DELETE SET NULL,
  enabled boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.harvester_queue TO authenticated;
GRANT ALL ON public.harvester_queue TO service_role;
ALTER TABLE public.harvester_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harvester_queue admin/curator all"
  ON public.harvester_queue FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid()))
  WITH CHECK (public.is_curator_or_admin(auth.uid()));
CREATE TRIGGER trg_harvester_queue_updated
  BEFORE UPDATE ON public.harvester_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. harvester_keywords
CREATE TABLE IF NOT EXISTS public.harvester_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  kind text NOT NULL,                             -- device | behavior | species | analysis | other
  frequency integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'auto',            -- auto | approved | rejected | merged
  canonical_term text,                            -- when merged, points to canonical
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (term, kind)
);
GRANT SELECT, INSERT, UPDATE ON public.harvester_keywords TO authenticated;
GRANT ALL ON public.harvester_keywords TO service_role;
ALTER TABLE public.harvester_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harvester_keywords admin/curator all"
  ON public.harvester_keywords FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid()))
  WITH CHECK (public.is_curator_or_admin(auth.uid()));
CREATE TRIGGER trg_harvester_keywords_updated
  BEFORE UPDATE ON public.harvester_keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_kw_kind_status ON public.harvester_keywords (kind, status);
CREATE INDEX IF NOT EXISTS idx_kw_freq        ON public.harvester_keywords (frequency DESC);

-- 5. harvester_synonyms
CREATE TABLE IF NOT EXISTS public.harvester_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias text NOT NULL,
  canonical text NOT NULL,
  kind text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alias, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.harvester_synonyms TO authenticated;
GRANT ALL ON public.harvester_synonyms TO service_role;
ALTER TABLE public.harvester_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harvester_synonyms admin/curator all"
  ON public.harvester_synonyms FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid()))
  WITH CHECK (public.is_curator_or_admin(auth.uid()));

-- 6. Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='harvester_runs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.harvester_runs';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='grant_methods_evidence'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.grant_methods_evidence';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='grant_methods_traversal_paths'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.grant_methods_traversal_paths';
  END IF;
END $$;

ALTER TABLE public.harvester_runs REPLICA IDENTITY FULL;
ALTER TABLE public.grant_methods_evidence REPLICA IDENTITY FULL;
ALTER TABLE public.grant_methods_traversal_paths REPLICA IDENTITY FULL;
