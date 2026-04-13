
CREATE TABLE public.security_audit_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type text NOT NULL DEFAULT 'weekly_automated',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  policy_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  drift_detected boolean NOT NULL DEFAULT false,
  tables_scanned integer NOT NULL DEFAULT 0,
  findings_count integer NOT NULL DEFAULT 0,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert audit results"
  ON public.security_audit_results FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can view audit results"
  ON public.security_audit_results FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update audit results"
  ON public.security_audit_results FOR UPDATE
  TO service_role
  USING (true);

CREATE INDEX idx_security_audit_created ON public.security_audit_results (created_at DESC);
