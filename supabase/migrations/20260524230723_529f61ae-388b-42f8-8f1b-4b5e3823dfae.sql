
CREATE TABLE public.lovable_credit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('topup','adjustment','refund')),
  credits numeric NOT NULL DEFAULT 0,
  usd_amount numeric NOT NULL DEFAULT 0,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lovable_user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_label text,
  period_month date NOT NULL,
  credits_used numeric NOT NULL DEFAULT 0,
  usd_equivalent numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_month)
);

CREATE INDEX idx_lovable_credit_events_occurred ON public.lovable_credit_events (occurred_at DESC);
CREATE INDEX idx_lovable_user_usage_period ON public.lovable_user_usage (period_month DESC);

ALTER TABLE public.lovable_credit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lovable_user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lovable_credit_events"
  ON public.lovable_credit_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage lovable_user_usage"
  ON public.lovable_user_usage FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lovable_user_usage_updated_at
  BEFORE UPDATE ON public.lovable_user_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.lovable_credit_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lovable_user_usage;
ALTER TABLE public.lovable_credit_events REPLICA IDENTITY FULL;
ALTER TABLE public.lovable_user_usage REPLICA IDENTITY FULL;
