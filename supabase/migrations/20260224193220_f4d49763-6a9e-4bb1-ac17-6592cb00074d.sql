
-- Create project_metadata table aligned with BBQS LinkML schema
CREATE TABLE public.project_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grant_id UUID REFERENCES public.grants(id) ON DELETE CASCADE,
  grant_number TEXT NOT NULL,
  study_species TEXT[] DEFAULT '{}',
  study_human BOOLEAN DEFAULT false,
  use_approaches TEXT[] DEFAULT '{}',
  use_sensors TEXT[] DEFAULT '{}',
  produce_data_modality TEXT[] DEFAULT '{}',
  produce_data_type TEXT[] DEFAULT '{}',
  use_analysis_types TEXT[] DEFAULT '{}',
  use_analysis_method TEXT[] DEFAULT '{}',
  develope_software_type TEXT[] DEFAULT '{}',
  develope_hardware_type TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  presentations JSONB DEFAULT '[]',
  website TEXT,
  collaborators JSONB DEFAULT '[]',
  related_project_ids UUID[] DEFAULT '{}',
  metadata_completeness INTEGER DEFAULT 0,
  last_edited_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grant_number)
);

-- Enable RLS
ALTER TABLE public.project_metadata ENABLE ROW LEVEL SECURITY;

-- Open reading for everyone
CREATE POLICY "Anyone can view project metadata"
ON public.project_metadata FOR SELECT
USING (true);

-- Open editing (no auth required per user preference)
CREATE POLICY "Anyone can insert project metadata"
ON public.project_metadata FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update project metadata"
ON public.project_metadata FOR UPDATE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_project_metadata_updated_at
BEFORE UPDATE ON public.project_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
