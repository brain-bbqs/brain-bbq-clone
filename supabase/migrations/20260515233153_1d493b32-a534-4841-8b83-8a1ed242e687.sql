
-- ============================================
-- A) INVESTIGATORS: hide emails from grant collaborators
-- ============================================

-- Tighten base SELECT to owner / admin / curator only (drops grant-share access)
DROP POLICY IF EXISTS "Restricted view of investigators" ON public.investigators;
CREATE POLICY "Owners curators and admins can view investigators"
  ON public.investigators
  FOR SELECT
  TO authenticated
  USING (
    public.is_curator_or_admin(auth.uid())
    OR (user_id = auth.uid())
  );

-- Keep investigators_public as a SECURITY DEFINER view that exposes
-- only non-PII columns to all users (view already excludes email/secondary_emails).
ALTER VIEW public.investigators_public SET (security_invoker = false);

-- ============================================
-- B) JOBS: hide contact info from non-admins/non-posters
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view active jobs" ON public.jobs;
CREATE POLICY "Admins or poster can view full jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (auth.uid() = posted_by)
  );

-- ============================================
-- C) FEATURE SUGGESTIONS: hide submitter identity
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view feature suggestions" ON public.feature_suggestions;
CREATE POLICY "Admins or submitter can view full feature suggestions"
  ON public.feature_suggestions
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (auth.uid() = submitted_by)
  );

-- Public sanitized view excluding submitter_name and submitted_by
DROP VIEW IF EXISTS public.feature_suggestions_public;
CREATE VIEW public.feature_suggestions_public
WITH (security_invoker = false) AS
  SELECT
    id,
    title,
    description,
    github_issue_number,
    github_issue_url,
    status,
    votes,
    created_at,
    updated_at
  FROM public.feature_suggestions;

GRANT SELECT ON public.feature_suggestions_public TO authenticated, anon;
