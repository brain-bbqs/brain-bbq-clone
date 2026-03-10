
-- Table to store NIH funding opportunities (RFAs, PAs, NOFOs)
CREATE TABLE public.funding_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fon text NOT NULL UNIQUE,  -- Funding Opportunity Number e.g. RFA-NS-25-016
  title text NOT NULL,
  activity_code text,  -- e.g. R34, R01, U01
  announcement_type text,  -- New, Reissue, etc.
  participating_orgs text[],  -- NIH institutes involved
  purpose text,
  posted_date date,
  open_date date,
  due_dates jsonb DEFAULT '[]'::jsonb,  -- Array of {date, type}
  expiration_date date,
  budget_ceiling numeric,
  budget_floor numeric,
  url text,
  status text NOT NULL DEFAULT 'open',  -- open, closed, upcoming
  relevance_tags text[] DEFAULT '{}'::text[],  -- e.g. BRAIN Initiative, neuroscience, behavior
  eligible_activity_codes text[] DEFAULT '{}'::text[],  -- Which grant types can apply
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funding_opportunities ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view
CREATE POLICY "Authenticated users can view funding opportunities"
  ON public.funding_opportunities FOR SELECT TO authenticated
  USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage funding opportunities"
  ON public.funding_opportunities FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users can insert (for community curation)
CREATE POLICY "Authenticated users can insert funding opportunities"
  ON public.funding_opportunities FOR INSERT TO authenticated
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_funding_opportunities_updated_at
  BEFORE UPDATE ON public.funding_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
