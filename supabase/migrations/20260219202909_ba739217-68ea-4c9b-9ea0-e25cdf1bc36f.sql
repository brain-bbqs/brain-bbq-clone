
-- Master resource type enum
CREATE TYPE public.resource_type AS ENUM (
  'investigator', 'organization', 'grant', 'publication', 'software', 'tool', 'dataset', 'protocol'
);

-- Master resources table — every entity in the system gets a row here
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type public.resource_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  external_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resources_type ON public.resources(resource_type);
CREATE INDEX idx_resources_name ON public.resources USING gin(to_tsvector('english', name));

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Service role can manage resources" ON public.resources FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Link existing investigators to resources
ALTER TABLE public.investigators ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL;

-- Link existing organizations to resources
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL;

-- Grants entity table
CREATE TABLE public.grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  grant_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  abstract TEXT,
  fiscal_year INTEGER,
  award_amount NUMERIC,
  nih_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view grants" ON public.grants FOR SELECT USING (true);
CREATE POLICY "Service role can manage grants" ON public.grants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Publications entity table
CREATE TABLE public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  pmid TEXT UNIQUE,
  doi TEXT,
  title TEXT NOT NULL,
  authors TEXT,
  journal TEXT,
  year INTEGER,
  citations INTEGER DEFAULT 0,
  rcr NUMERIC DEFAULT 0,
  pubmed_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view publications" ON public.publications FOR SELECT USING (true);
CREATE POLICY "Service role can manage publications" ON public.publications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Software/tools entity table
CREATE TABLE public.software_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  docs_url TEXT,
  language TEXT,
  license TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.software_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view software tools" ON public.software_tools FOR SELECT USING (true);
CREATE POLICY "Service role can manage software tools" ON public.software_tools FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Resource links — connects ANY two entities (many-to-many)
CREATE TABLE public.resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'related_to',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, target_id, relationship)
);

CREATE INDEX idx_resource_links_source ON public.resource_links(source_id);
CREATE INDEX idx_resource_links_target ON public.resource_links(target_id);

ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view resource links" ON public.resource_links FOR SELECT USING (true);
CREATE POLICY "Service role can manage resource links" ON public.resource_links FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Timestamp triggers
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grants_updated_at BEFORE UPDATE ON public.grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_software_tools_updated_at BEFORE UPDATE ON public.software_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
