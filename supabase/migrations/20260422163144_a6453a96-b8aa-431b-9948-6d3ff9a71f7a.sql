-- Centralized alert log for critical edge-function failures
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN ('info','warning','critical')),
  source TEXT NOT NULL,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  fingerprint TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  github_issue_url TEXT,
  github_issue_number INTEGER,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_system_alerts_fingerprint_unresolved
  ON public.system_alerts (fingerprint)
  WHERE resolved = false;

CREATE INDEX idx_system_alerts_last_seen ON public.system_alerts (last_seen_at DESC);
CREATE INDEX idx_system_alerts_unresolved ON public.system_alerts (resolved, severity, last_seen_at DESC);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can read all alerts
CREATE POLICY "Admins can view system alerts"
  ON public.system_alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can resolve / annotate
CREATE POLICY "Admins can update system alerts"
  ON public.system_alerts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/DELETE policies for end users → service role only

CREATE TRIGGER update_system_alerts_updated_at
  BEFORE UPDATE ON public.system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();