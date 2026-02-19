
-- Add author_orcids JSONB column to store PMID->author ORCID mapping
-- Format: [{"name": "Smith J", "orcid": "0000-0001-2345-6789"}, ...]
ALTER TABLE public.publications
ADD COLUMN IF NOT EXISTS author_orcids JSONB DEFAULT '[]'::jsonb;
