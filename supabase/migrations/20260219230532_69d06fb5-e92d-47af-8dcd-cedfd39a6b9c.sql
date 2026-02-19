
-- Add skills and research_areas columns to investigators table
ALTER TABLE public.investigators
ADD COLUMN skills TEXT[] DEFAULT '{}',
ADD COLUMN research_areas TEXT[] DEFAULT '{}';

-- Create GIN indexes for efficient array searches
CREATE INDEX idx_investigators_skills ON public.investigators USING GIN(skills);
CREATE INDEX idx_investigators_research_areas ON public.investigators USING GIN(research_areas);
