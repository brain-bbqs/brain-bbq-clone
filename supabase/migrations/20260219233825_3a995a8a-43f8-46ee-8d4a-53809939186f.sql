
-- Add keywords column to publications table
ALTER TABLE public.publications
ADD COLUMN keywords TEXT[] DEFAULT '{}';

-- Add a GIN index for efficient keyword searching
CREATE INDEX idx_publications_keywords ON public.publications USING GIN(keywords);
