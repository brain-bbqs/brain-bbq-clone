
CREATE TABLE public.state_privacy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL,
  state_name text NOT NULL,
  last_reviewed date NOT NULL DEFAULT CURRENT_DATE,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources jsonb DEFAULT '[]'::jsonb,
  scan_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(state)
);

ALTER TABLE public.state_privacy_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view state privacy rules"
  ON public.state_privacy_rules FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage state privacy rules"
  ON public.state_privacy_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_state_privacy_rules_updated_at
  BEFORE UPDATE ON public.state_privacy_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
