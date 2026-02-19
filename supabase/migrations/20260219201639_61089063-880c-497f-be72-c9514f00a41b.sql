
-- Investigators entity table
CREATE TABLE public.investigators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  profile_url TEXT,
  orcid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name)
);

ALTER TABLE public.investigators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view investigators"
  ON public.investigators FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert investigators"
  ON public.investigators FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update investigators"
  ON public.investigators FOR UPDATE
  TO authenticated
  USING (true);

-- Organizations entity table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view organizations"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Investigator <-> Organization relationship
CREATE TABLE public.investigator_organizations (
  investigator_id UUID NOT NULL REFERENCES public.investigators(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (investigator_id, organization_id)
);

ALTER TABLE public.investigator_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view investigator orgs"
  ON public.investigator_organizations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert investigator orgs"
  ON public.investigator_organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant <-> Investigator relationship  
CREATE TABLE public.grant_investigators (
  grant_number TEXT NOT NULL,
  investigator_id UUID NOT NULL REFERENCES public.investigators(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'co_pi',
  PRIMARY KEY (grant_number, investigator_id)
);

ALTER TABLE public.grant_investigators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grant investigators"
  ON public.grant_investigators FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert grant investigators"
  ON public.grant_investigators FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Timestamp trigger for investigators
CREATE TRIGGER update_investigators_updated_at
  BEFORE UPDATE ON public.investigators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
