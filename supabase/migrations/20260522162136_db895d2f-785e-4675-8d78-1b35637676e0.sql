
-- Providers
DO $$ BEGIN
  CREATE TYPE public.budget_provider AS ENUM ('github','supabase','lovable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Config (one row per provider)
CREATE TABLE IF NOT EXISTS public.budget_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.budget_provider NOT NULL UNIQUE,
  monthly_limit_usd numeric(12,2) NOT NULL DEFAULT 0,
  alert_threshold_pct integer NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 200),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  manual_usage_usd numeric(12,2),
  manual_notes text,
  last_synced_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view budget config" ON public.budget_config;
CREATE POLICY "Admins can view budget config" ON public.budget_config
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert budget config" ON public.budget_config;
CREATE POLICY "Admins can insert budget config" ON public.budget_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update budget config" ON public.budget_config;
CREATE POLICY "Admins can update budget config" ON public.budget_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role manages budget config" ON public.budget_config;
CREATE POLICY "Service role manages budget config" ON public.budget_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_budget_config_updated ON public.budget_config;
CREATE TRIGGER trg_budget_config_updated
  BEFORE UPDATE ON public.budget_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Snapshots (time series)
CREATE TABLE IF NOT EXISTS public.budget_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.budget_provider NOT NULL,
  metric_key text NOT NULL,
  metric_label text,
  value_numeric numeric,
  unit text,
  period_start date,
  period_end date,
  captured_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_budget_snapshots_provider_time
  ON public.budget_snapshots (provider, captured_at DESC);

ALTER TABLE public.budget_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view budget snapshots" ON public.budget_snapshots;
CREATE POLICY "Admins can view budget snapshots" ON public.budget_snapshots
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role manages budget snapshots" ON public.budget_snapshots;
CREATE POLICY "Service role manages budget snapshots" ON public.budget_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Realtime
ALTER TABLE public.budget_config REPLICA IDENTITY FULL;
ALTER TABLE public.budget_snapshots REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_config;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_snapshots;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed rows (zero-limit defaults; admin sets later)
INSERT INTO public.budget_config (provider, monthly_limit_usd, alert_threshold_pct)
VALUES ('github', 0, 80), ('supabase', 0, 80), ('lovable', 0, 80)
ON CONFLICT (provider) DO NOTHING;
