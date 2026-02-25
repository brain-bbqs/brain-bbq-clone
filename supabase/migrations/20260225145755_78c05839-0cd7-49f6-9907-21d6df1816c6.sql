
-- Species table linked to resources
CREATE TABLE public.species (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  common_name TEXT,
  taxonomy_class TEXT,
  taxonomy_order TEXT,
  taxonomy_family TEXT,
  taxonomy_genus TEXT,
  resource_id UUID REFERENCES public.resources(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Taxonomies table for controlled vocabularies (autocomplete)
CREATE TABLE public.taxonomies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT,
  parent_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, value)
);

-- RLS policies
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view species" ON public.species FOR SELECT USING (true);
CREATE POLICY "Anyone can insert species" ON public.species FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update species" ON public.species FOR UPDATE USING (true);

CREATE POLICY "Anyone can view taxonomies" ON public.taxonomies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert taxonomies" ON public.taxonomies FOR INSERT WITH CHECK (true);

-- Trigger for updated_at on species
CREATE TRIGGER update_species_updated_at
  BEFORE UPDATE ON public.species
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
