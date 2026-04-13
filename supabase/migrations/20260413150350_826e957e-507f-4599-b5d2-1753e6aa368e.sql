-- 1. Restrict feature_votes SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view votes" ON public.feature_votes;
CREATE POLICY "Authenticated users can view votes"
  ON public.feature_votes FOR SELECT TO authenticated
  USING (true);

-- 2. Restrict edit_history SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view edit history" ON public.edit_history;
CREATE POLICY "Authenticated users can view edit history"
  ON public.edit_history FOR SELECT TO authenticated
  USING (true);

-- 3. Restrict allowed_domains SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view allowed domains" ON public.allowed_domains;
CREATE POLICY "Authenticated users can view allowed domains"
  ON public.allowed_domains FOR SELECT TO authenticated
  USING (true);

-- 4. Create public_jobs view hiding PII
CREATE OR REPLACE VIEW public.public_jobs AS
SELECT
  id,
  title,
  institution,
  department,
  location,
  job_type,
  description,
  application_url,
  is_active,
  expires_at,
  organization_id,
  resource_id,
  created_at,
  updated_at
FROM public.jobs
WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_jobs TO anon;
GRANT SELECT ON public.public_jobs TO authenticated;