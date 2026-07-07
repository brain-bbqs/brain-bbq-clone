-- Broaden the consortium DIRECTORY view so a single member lookup can answer
-- onboarding questions ("when was X onboarded?", "is their onboarding complete?")
-- without a second surgical read. Adds onboarding_completed_at + onboarding_checklist
-- (non-sensitive). Everything else is unchanged from 20260619140000.
--
-- secondary_emails stays DELIBERATELY EXCLUDED — they are access-granting (the
-- Globus sign-in gate matches on them), so they remain private to the base table's
-- owner/curator/admin SELECT policy and are never exposed via this member-readable,
-- authenticated-only directory view.
DROP VIEW IF EXISTS public.investigator_directory;

CREATE VIEW public.investigator_directory
WITH (security_invoker = false) AS
SELECT
  id, name, email, institution, orcid, profile_url, role,
  working_groups, research_areas, skills, resource_id, scholar_id,
  user_id, created_at, updated_at,
  onboarding_completed_at, onboarding_checklist
FROM public.investigators;

-- Authenticated members only — anonymous visitors must NOT see emails.
REVOKE ALL ON public.investigator_directory FROM PUBLIC, anon;
GRANT SELECT ON public.investigator_directory TO authenticated;
