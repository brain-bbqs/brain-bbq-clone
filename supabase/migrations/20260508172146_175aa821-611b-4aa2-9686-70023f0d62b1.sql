-- ── Investigators: public sanitized view, restrict raw table to authenticated ──
CREATE OR REPLACE VIEW public.investigators_public
WITH (security_invoker = true) AS
SELECT
  id, name, orcid, profile_url, role, working_groups, research_areas,
  skills, resource_id, scholar_id, user_id, pending_role,
  created_at, updated_at
FROM public.investigators;

GRANT SELECT ON public.investigators_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view investigators" ON public.investigators;
CREATE POLICY "Authenticated users can view investigators"
  ON public.investigators
  FOR SELECT
  TO authenticated
  USING (true);

-- ── Feature suggestions: drop email column, add submitter_name ───────────────
ALTER TABLE public.feature_suggestions
  ADD COLUMN IF NOT EXISTS submitter_name text;

ALTER TABLE public.feature_suggestions
  DROP COLUMN IF EXISTS submitted_by_email;