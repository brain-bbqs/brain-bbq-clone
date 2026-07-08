-- Allow curators/admins to DELETE access_requests.
--
-- Before this, access_requests had INSERT (anon/auth), SELECT + UPDATE
-- (curator/admin) policies but NO delete policy — so nothing could remove a row.
-- The onboarding agent's RESET flow (investigatorDelete) purges a member's
-- access_requests so a re-tested email stops accumulating stale "Approved" rows in
-- the admin console's "Decided requests" list. That delete runs as the acting
-- admin's JWT, so RLS must permit it. 2026-07-07.
DROP POLICY IF EXISTS "Curators and admins can delete access requests" ON public.access_requests;
CREATE POLICY "Curators and admins can delete access requests"
ON public.access_requests
FOR DELETE
TO authenticated
USING (public.is_curator_or_admin(auth.uid()));
