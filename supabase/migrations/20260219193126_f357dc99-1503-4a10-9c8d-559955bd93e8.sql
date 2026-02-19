-- Drop the NER-related database function
DROP FUNCTION IF EXISTS public.search_entities_by_similarity(extensions.vector, double precision, integer);

-- Drop tables (ner_entities first due to FK dependency)
DROP TABLE IF EXISTS public.ner_entities;
DROP TABLE IF EXISTS public.ner_extractions;