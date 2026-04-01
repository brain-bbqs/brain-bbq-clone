
-- Phase 2: Consolidate projects array columns into metadata JSONB
-- Step 1: Merge existing array data into the metadata JSONB column (non-destructive)
-- This preserves backward compatibility while we update code

UPDATE public.projects
SET metadata = COALESCE(metadata, '{}'::jsonb)
  || jsonb_build_object(
    'use_approaches', COALESCE(to_jsonb(use_approaches), '[]'::jsonb),
    'use_sensors', COALESCE(to_jsonb(use_sensors), '[]'::jsonb),
    'produce_data_modality', COALESCE(to_jsonb(produce_data_modality), '[]'::jsonb),
    'produce_data_type', COALESCE(to_jsonb(produce_data_type), '[]'::jsonb),
    'use_analysis_types', COALESCE(to_jsonb(use_analysis_types), '[]'::jsonb),
    'use_analysis_method', COALESCE(to_jsonb(use_analysis_method), '[]'::jsonb),
    'develope_software_type', COALESCE(to_jsonb(develope_software_type), '[]'::jsonb),
    'develope_hardware_type', COALESCE(to_jsonb(develope_hardware_type), '[]'::jsonb),
    'collaborators', COALESCE(collaborators, '[]'::jsonb),
    'presentations', COALESCE(presentations, '[]'::jsonb),
    'related_project_ids', COALESCE(to_jsonb(related_project_ids), '[]'::jsonb)
  )
WHERE TRUE;

-- Step 2: Now drop the redundant columns
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS use_approaches,
  DROP COLUMN IF EXISTS use_sensors,
  DROP COLUMN IF EXISTS produce_data_modality,
  DROP COLUMN IF EXISTS produce_data_type,
  DROP COLUMN IF EXISTS use_analysis_types,
  DROP COLUMN IF EXISTS use_analysis_method,
  DROP COLUMN IF EXISTS develope_software_type,
  DROP COLUMN IF EXISTS develope_hardware_type,
  DROP COLUMN IF EXISTS collaborators,
  DROP COLUMN IF EXISTS presentations,
  DROP COLUMN IF EXISTS related_project_ids;

-- Phase 2b: Simplify paper_extractions - consolidate arrays into extracted_metadata
UPDATE public.paper_extractions
SET extracted_metadata = COALESCE(extracted_metadata, '{}'::jsonb)
  || jsonb_build_object(
    'study_species', COALESCE(to_jsonb(study_species), '[]'::jsonb),
    'use_sensors', COALESCE(to_jsonb(use_sensors), '[]'::jsonb),
    'use_approaches', COALESCE(to_jsonb(use_approaches), '[]'::jsonb),
    'produce_data_modality', COALESCE(to_jsonb(produce_data_modality), '[]'::jsonb),
    'produce_data_type', COALESCE(to_jsonb(produce_data_type), '[]'::jsonb),
    'use_analysis_method', COALESCE(to_jsonb(use_analysis_method), '[]'::jsonb),
    'use_analysis_types', COALESCE(to_jsonb(use_analysis_types), '[]'::jsonb),
    'develope_software_type', COALESCE(to_jsonb(develope_software_type), '[]'::jsonb),
    'develope_hardware_type', COALESCE(to_jsonb(develope_hardware_type), '[]'::jsonb),
    'grant_numbers', COALESCE(to_jsonb(grant_numbers), '[]'::jsonb),
    'orcids', COALESCE(to_jsonb(orcids), '[]'::jsonb),
    'keywords', COALESCE(to_jsonb(keywords), '[]'::jsonb),
    'authors', authors
  )
WHERE TRUE;

ALTER TABLE public.paper_extractions
  DROP COLUMN IF EXISTS study_species,
  DROP COLUMN IF EXISTS use_sensors,
  DROP COLUMN IF EXISTS use_approaches,
  DROP COLUMN IF EXISTS produce_data_modality,
  DROP COLUMN IF EXISTS produce_data_type,
  DROP COLUMN IF EXISTS use_analysis_method,
  DROP COLUMN IF EXISTS use_analysis_types,
  DROP COLUMN IF EXISTS develope_software_type,
  DROP COLUMN IF EXISTS develope_hardware_type,
  DROP COLUMN IF EXISTS grant_numbers,
  DROP COLUMN IF EXISTS orcids,
  DROP COLUMN IF EXISTS keywords,
  DROP COLUMN IF EXISTS authors,
  DROP COLUMN IF EXISTS raw_text,
  DROP COLUMN IF EXISTS chat_messages;

-- Phase 2c: Simplify edit_history
ALTER TABLE public.edit_history
  DROP COLUMN IF EXISTS validation_protocols;
