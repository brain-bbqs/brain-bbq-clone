-- Make investigators_public bypass base-table RLS so authenticated users
-- can see all investigator rows minus PII (emails). The base table's
-- restrictive SELECT policy continues to protect email/secondary_emails.
DROP VIEW IF EXISTS public.investigators_public;

CREATE VIEW public.investigators_public
WITH (security_invoker = false) AS
SELECT
  id, name, orcid, profile_url, role, working_groups, research_areas,
  skills, resource_id, scholar_id, user_id, pending_role,
  created_at, updated_at
FROM public.investigators;

-- Authenticated only: anonymous visitors must sign in to browse the directory.
REVOKE ALL ON public.investigators_public FROM PUBLIC, anon;
GRANT SELECT ON public.investigators_public TO authenticated;