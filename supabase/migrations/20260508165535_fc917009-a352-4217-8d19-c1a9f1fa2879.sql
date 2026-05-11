-- 1. Add role_source column
ALTER TABLE public.grant_investigators
  ADD COLUMN IF NOT EXISTS role_source text NOT NULL DEFAULT 'curator';

-- 2. Backfill: assume existing PI-like roles came from RePORTER
UPDATE public.grant_investigators
   SET role_source = 'reporter'
 WHERE lower(role) IN ('pi','contact_pi','co_pi','mpi')
   AND role_source = 'curator';

-- 3. Constrain allowed values
ALTER TABLE public.grant_investigators
  DROP CONSTRAINT IF EXISTS grant_investigators_role_source_check;
ALTER TABLE public.grant_investigators
  ADD CONSTRAINT grant_investigators_role_source_check
  CHECK (role_source IN ('reporter','curator'));

-- 4. Ensure (grant_id, investigator_id) is unique so we can upsert cleanly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename = 'grant_investigators'
       AND indexname = 'grant_investigators_grant_inv_unique'
  ) THEN
    CREATE UNIQUE INDEX grant_investigators_grant_inv_unique
      ON public.grant_investigators (grant_id, investigator_id);
  END IF;
END $$;