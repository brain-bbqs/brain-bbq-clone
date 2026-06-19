-- Consortium DIRECTORY: any SIGNED-IN member may look up any other member's
-- professional contact info (name, email, institution, role, ORCID, interests),
-- regardless of tier. This intentionally relaxes the 20260515233153 decision that
-- hid emails from non-owner/curator/admin — per an explicit consortium-owner
-- directive that members should be able to find each other's contact details.
--
-- Implemented as a SECURITY DEFINER view (bypasses the base-table SELECT policy,
-- which stays owner/curator/admin-only) granted to AUTHENTICATED ONLY — so emails
-- are visible to signed-in members but NEVER to anonymous web visitors. The public,
-- anon-safe `investigators_public` view is left unchanged (no email). secondary_emails
-- are deliberately EXCLUDED — they are access-granting (the sign-in gate matches them),
-- so they remain private.
DROP VIEW IF EXISTS public.investigator_directory;

CREATE VIEW public.investigator_directory
WITH (security_invoker = false) AS
SELECT
  id, name, email, institution, orcid, profile_url, role,
  working_groups, research_areas, skills, resource_id, scholar_id,
  user_id, created_at, updated_at
FROM public.investigators;

-- Authenticated members only — anonymous visitors must NOT see emails.
REVOKE ALL ON public.investigator_directory FROM PUBLIC, anon;
GRANT SELECT ON public.investigator_directory TO authenticated;
