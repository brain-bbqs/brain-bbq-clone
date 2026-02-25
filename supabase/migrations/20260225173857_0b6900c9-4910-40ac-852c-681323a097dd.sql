
-- Add ontology reference table for the consortium's standards
CREATE TABLE public.ontology_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  abbreviation text,
  description text,
  category text NOT NULL, -- 'ontology', 'data_standard', 'ethics_governance'
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ontology_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ontology standards"
  ON public.ontology_standards FOR SELECT USING (true);

-- Track custom field usage for auto-promotion
CREATE TABLE public.custom_field_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  field_value text NOT NULL,
  category text, -- matched taxonomy category if applicable
  usage_count integer NOT NULL DEFAULT 1,
  closest_canonical text, -- nearest existing taxonomy value
  levenshtein_distance integer, -- distance to closest canonical
  promoted boolean NOT NULL DEFAULT false,
  promoted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(field_name, field_value)
);

ALTER TABLE public.custom_field_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom field usage"
  ON public.custom_field_usage FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert custom field usage"
  ON public.custom_field_usage FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update custom field usage"
  ON public.custom_field_usage FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Seed the 6 consortium standards/ontologies
INSERT INTO public.ontology_standards (name, abbreviation, description, category, url) VALUES
  ('Brain Imaging Data Structure', 'BIDS', 'A standard for organizing and describing neuroscience data to facilitate sharing and analysis.', 'data_standard', 'https://bids.neuroimaging.io/'),
  ('Neurodata Without Borders', 'NWB', 'Open standard format for neurophysiology data (neural recordings, behavioral events, etc.) to enhance sharing and integration.', 'data_standard', 'https://www.nwb.org/'),
  ('Neuro Behavior Ontology', 'NBO', 'Ontology of human and animal behaviors and behavioral phenotypes.', 'ontology', 'https://bioportal.bioontology.org/ontologies/NBO'),
  ('Hierarchical Event Descriptors', 'HED', 'Standardized tagging system for events and metadata in experiments. HED tags provide a consistent way to label events in neurobehavioral datasets, improving interoperability and analysis.', 'ontology', 'https://www.hedtags.org/'),
  ('NIH BRAIN Initiative Neuroethics Guiding Principles', NULL, 'Eight principles outlining ethical considerations for brain research, emphasizing safety, autonomy, privacy of neural data, and public engagement.', 'ethics_governance', 'https://braininitiative.nih.gov/about/neuroethics'),
  ('Open Brain Consent', NULL, 'Initiative providing standardized consent language and tools to facilitate sharing of human brain data.', 'ethics_governance', 'https://open-brain-consent.readthedocs.io/');
