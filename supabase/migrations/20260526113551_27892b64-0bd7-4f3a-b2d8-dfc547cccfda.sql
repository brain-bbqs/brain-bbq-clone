CREATE TABLE public.lovable_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_date date NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  external_invoice_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lovable_invoices_date ON public.lovable_invoices (invoice_date DESC);

ALTER TABLE public.lovable_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view lovable invoices"
  ON public.lovable_invoices FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert lovable invoices"
  ON public.lovable_invoices FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update lovable invoices"
  ON public.lovable_invoices FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete lovable invoices"
  ON public.lovable_invoices FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lovable_invoices_updated
  BEFORE UPDATE ON public.lovable_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();