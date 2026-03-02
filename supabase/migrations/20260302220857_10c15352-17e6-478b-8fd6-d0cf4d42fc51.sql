
-- Table to track which fields users correct and what values they add/remove
CREATE TABLE public.extraction_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  extraction_id uuid REFERENCES public.paper_extractions(id) ON DELETE CASCADE NOT NULL,
  field_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('add', 'remove', 'replace')),
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Materialized view: top correction patterns (most frequently added values per field)
CREATE VIEW public.correction_pattern_summary AS
SELECT
  field_name,
  action,
  value,
  COUNT(*) as frequency
FROM public.extraction_corrections
GROUP BY field_name, action, value
HAVING COUNT(*) >= 2
ORDER BY frequency DESC;

-- RLS
ALTER TABLE public.extraction_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own corrections"
  ON public.extraction_corrections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view corrections"
  ON public.extraction_corrections FOR SELECT
  USING (true);

-- Index for fast aggregation
CREATE INDEX idx_corrections_field_action ON public.extraction_corrections(field_name, action);
