
-- Link publications to projects via grant number
CREATE TABLE IF NOT EXISTS public.project_publications (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, publication_id)
);

ALTER TABLE public.project_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view project publications" ON public.project_publications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert project publications" ON public.project_publications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete project publications" ON public.project_publications FOR DELETE USING (true);

-- Link resources (tools, datasets, etc.) to projects
CREATE TABLE IF NOT EXISTS public.project_resources (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'uses',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, resource_id)
);

ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view project resources" ON public.project_resources FOR SELECT USING (true);
CREATE POLICY "Anyone can insert project resources" ON public.project_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete project resources" ON public.project_resources FOR DELETE USING (true);

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE project_publications;
ALTER PUBLICATION supabase_realtime ADD TABLE project_resources;
