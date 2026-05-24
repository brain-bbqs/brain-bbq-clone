
-- EMBER dandisets ingestion
CREATE TABLE IF NOT EXISTS public.dandisets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
  instance text NOT NULL DEFAULT 'ember',
  dandiset_id text NOT NULL,
  name text NOT NULL,
  description text,
  contact_name text,
  file_count integer,
  size_bytes bigint,
  license text,
  access text,
  species text[],
  award_numbers text[] DEFAULT '{}'::text[],
  draft_url text,
  api_url text,
  neurosift_url text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance, dandiset_id)
);

ALTER TABLE public.dandisets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dandisets"
  ON public.dandisets FOR SELECT USING (true);

CREATE POLICY "Service role manages dandisets"
  ON public.dandisets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_dandisets_updated_at
  BEFORE UPDATE ON public.dandisets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Join table: many-to-many grants <-> dandisets
CREATE TABLE IF NOT EXISTS public.grant_dandisets (
  grant_id uuid NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  dandiset_id uuid NOT NULL REFERENCES public.dandisets(id) ON DELETE CASCADE,
  match_source text NOT NULL DEFAULT 'award_number',
  matched_award text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grant_id, dandiset_id)
);

ALTER TABLE public.grant_dandisets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grant_dandisets"
  ON public.grant_dandisets FOR SELECT USING (true);

CREATE POLICY "Service role manages grant_dandisets"
  ON public.grant_dandisets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Curators/admins can manage grant_dandisets"
  ON public.grant_dandisets FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid()))
  WITH CHECK (public.is_curator_or_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_grant_dandisets_grant ON public.grant_dandisets(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_dandisets_dandiset ON public.grant_dandisets(dandiset_id);
CREATE INDEX IF NOT EXISTS idx_dandisets_award_numbers ON public.dandisets USING GIN (award_numbers);
