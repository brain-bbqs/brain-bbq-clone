
-- Add Google Scholar user ID to investigators
ALTER TABLE public.investigators
ADD COLUMN scholar_id TEXT;

-- Add index for lookups
CREATE INDEX idx_investigators_scholar_id ON public.investigators(scholar_id) WHERE scholar_id IS NOT NULL;
