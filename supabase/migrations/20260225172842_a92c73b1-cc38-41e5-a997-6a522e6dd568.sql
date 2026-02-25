
-- 1. Allowed email domains for consortium universities
CREATE TABLE public.allowed_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view allowed domains"
  ON public.allowed_domains FOR SELECT
  USING (true);

-- 2. User profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  organization_id uuid REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _domain text;
  _org_id uuid;
BEGIN
  _domain := split_part(NEW.email, '@', 2);
  SELECT organization_id INTO _org_id
    FROM public.allowed_domains
    WHERE domain = _domain
    LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _org_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Security definer function to check if user can edit a project
CREATE OR REPLACE FUNCTION public.user_can_edit_project(_user_id uuid, _grant_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.investigator_organizations io ON io.organization_id = p.organization_id
    JOIN public.grant_investigators gi ON gi.investigator_id = io.investigator_id
    WHERE p.id = _user_id
      AND gi.grant_number = _grant_number
  )
$$;

-- 5. Seed allowed domains for consortium universities
INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'mit.edu', id FROM public.organizations WHERE name ILIKE '%MIT%' OR name ILIKE '%Massachusetts Institute%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'harvard.edu', id FROM public.organizations WHERE name ILIKE '%Harvard%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'bu.edu', id FROM public.organizations WHERE name ILIKE '%Boston University%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'columbia.edu', id FROM public.organizations WHERE name ILIKE '%Columbia%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'upenn.edu', id FROM public.organizations WHERE name ILIKE '%Penn%' OR name ILIKE '%University of Pennsylvania%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'jhu.edu', id FROM public.organizations WHERE name ILIKE '%Johns Hopkins%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'caltech.edu', id FROM public.organizations WHERE name ILIKE '%Caltech%' OR name ILIKE '%California Institute%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'stanford.edu', id FROM public.organizations WHERE name ILIKE '%Stanford%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'ucsd.edu', id FROM public.organizations WHERE name ILIKE '%UC San Diego%' OR name ILIKE '%UCSD%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'berkeley.edu', id FROM public.organizations WHERE name ILIKE '%Berkeley%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'uchicago.edu', id FROM public.organizations WHERE name ILIKE '%Chicago%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'yale.edu', id FROM public.organizations WHERE name ILIKE '%Yale%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'nyu.edu', id FROM public.organizations WHERE name ILIKE '%New York University%' OR name ILIKE '%NYU%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'princeton.edu', id FROM public.organizations WHERE name ILIKE '%Princeton%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'gatech.edu', id FROM public.organizations WHERE name ILIKE '%Georgia%Tech%' LIMIT 1;

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'washington.edu', id FROM public.organizations WHERE name ILIKE '%University of Washington%' LIMIT 1;
