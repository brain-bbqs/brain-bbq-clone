
CREATE TABLE IF NOT EXISTS public.cohort_summaries (
  mechanism text PRIMARY KEY,
  summary text NOT NULL,
  n_grants integer NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cohort_summaries TO authenticated;
GRANT ALL ON public.cohort_summaries TO service_role;
ALTER TABLE public.cohort_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read cohort summaries"
  ON public.cohort_summaries FOR SELECT TO authenticated USING (true);
