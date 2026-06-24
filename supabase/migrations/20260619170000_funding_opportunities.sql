-- Funding / grant opportunities surfaced at the top of the grants page. Added by the
-- BBQS agent (fundingOpportunityInsert) or curators, e.g. a funding-finder link.
-- Public-readable (the grants page is public); only curators/admins may write.

CREATE TABLE IF NOT EXISTS public.funding_opportunities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  url         text NOT NULL,
  description text,
  source      text,           -- who lists it, e.g. "The Transmitter", "NIH"
  deadline    text,           -- ISO date or free text ("rolling")
  amount      text,
  eligibility text,
  is_active   boolean NOT NULL DEFAULT true,
  posted_by   uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_opportunities ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous site visitors) can view them — shown on the public grants page.
DROP POLICY IF EXISTS "Anyone can view funding opportunities" ON public.funding_opportunities;
CREATE POLICY "Anyone can view funding opportunities"
  ON public.funding_opportunities FOR SELECT
  USING (true);

-- Only curators/admins create/edit/remove them (matches the agent's RLS-as-user model).
DROP POLICY IF EXISTS "Curators and admins manage funding opportunities" ON public.funding_opportunities;
CREATE POLICY "Curators and admins manage funding opportunities"
  ON public.funding_opportunities FOR ALL
  TO authenticated
  USING (public.is_curator_or_admin(auth.uid()))
  WITH CHECK (public.is_curator_or_admin(auth.uid()));

GRANT SELECT ON public.funding_opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.funding_opportunities TO authenticated;

CREATE INDEX IF NOT EXISTS idx_funding_opportunities_active ON public.funding_opportunities (is_active, created_at DESC);
