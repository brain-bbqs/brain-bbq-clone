
-- Manufacturers
CREATE TABLE IF NOT EXISTS public.device_manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}',
  homepage_url text,
  country text,
  notes text,
  last_crawled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.device_manufacturers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_manufacturers TO authenticated;
GRANT ALL ON public.device_manufacturers TO service_role;

ALTER TABLE public.device_manufacturers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_manufacturers readable by all"
  ON public.device_manufacturers FOR SELECT USING (true);
CREATE POLICY "device_manufacturers writable by curators"
  ON public.device_manufacturers FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid()))
  WITH CHECK (public.is_curator_or_admin(auth.uid()));

CREATE TRIGGER trg_device_manufacturers_updated
  BEFORE UPDATE ON public.device_manufacturers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Models
CREATE TABLE IF NOT EXISTS public.device_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid REFERENCES public.device_manufacturers(id) ON DELETE SET NULL,
  device_class text NOT NULL,
  model_name text NOT NULL,
  product_url text,
  regulatory text,
  manual_urls text[] NOT NULL DEFAULT '{}',
  aliases text[] NOT NULL DEFAULT '{}',
  confidence numeric,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manufacturer_id, device_class, model_name)
);

GRANT SELECT ON public.device_models TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_models TO authenticated;
GRANT ALL ON public.device_models TO service_role;

ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_models readable by all"
  ON public.device_models FOR SELECT USING (true);
CREATE POLICY "device_models writable by curators"
  ON public.device_models FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid()))
  WITH CHECK (public.is_curator_or_admin(auth.uid()));

CREATE TRIGGER trg_device_models_updated
  BEFORE UPDATE ON public.device_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_device_models_class ON public.device_models(device_class);
CREATE INDEX IF NOT EXISTS idx_device_models_mfr ON public.device_models(manufacturer_id);

-- Extend evidence
ALTER TABLE public.grant_methods_evidence
  ADD COLUMN IF NOT EXISTS device_model text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS manufacturer text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS modality text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS manual_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS regulatory text;

-- Rollup view: one row per (grant, device_class, model, manufacturer)
CREATE OR REPLACE VIEW public.project_devices_v AS
SELECT
  e.seed_grant_number AS grant_number,
  dc.device_class,
  dm.model_name,
  mf.manufacturer,
  COUNT(*)::int AS evidence_count,
  MAX(e.confidence)::numeric AS confidence_max,
  (ARRAY_AGG(DISTINCT e.pmid) FILTER (WHERE e.pmid IS NOT NULL))[1] AS sample_pmid,
  ARRAY_AGG(DISTINCT u) FILTER (WHERE u IS NOT NULL) AS manual_urls
FROM public.grant_methods_evidence e
LEFT JOIN LATERAL unnest(NULLIF(e.device_class, '{}')) AS dc(device_class) ON true
LEFT JOIN LATERAL unnest(NULLIF(e.device_model, '{}')) AS dm(model_name) ON true
LEFT JOIN LATERAL unnest(NULLIF(e.manufacturer, '{}')) AS mf(manufacturer) ON true
LEFT JOIN LATERAL unnest(NULLIF(e.manual_urls, '{}')) AS mu(u) ON true
WHERE dc.device_class IS NOT NULL
GROUP BY e.seed_grant_number, dc.device_class, dm.model_name, mf.manufacturer;

GRANT SELECT ON public.project_devices_v TO anon, authenticated, service_role;
