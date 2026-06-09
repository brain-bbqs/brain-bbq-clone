-- Add a SELECT RLS policy to public.grant_investigators.
--
-- BACKGROUND
-- grant_investigators had RLS enabled with INSERT/UPDATE/DELETE policies
-- (all gated on public.user_can_edit_grant_roster) but — as of the 2026-04-17
-- migration that introduced them — NO SELECT policy. In PostgreSQL, a table with
-- RLS enabled and no permissive SELECT policy returns ZERO rows to every
-- non-owner role, silently (no error). Effects observed in bbqs-agent:
--
--   1. checkExistingMember (read-tools.ts) queries
--      grant_investigators?investigator_id=eq.<id>&select=role,grants(...) as the
--      acting user's JWT and always gets [] → it cannot see a member's existing
--      grant memberships (duplicate-detection / "who is on this grant" blind spot).
--
--   2. The offboarding full-departure reset hook (applyWrite.server.ts) SELECTs
--      the member's REMAINING grant_investigators rows after a removal to decide
--      whether to clear onboarding. With no SELECT policy it reads 0 rows and can
--      false-positive a full-departure reset even when other grants remain.
--
-- FIX
-- Grant SELECT to the SAME audience as the existing write policies — i.e.
-- user_can_edit_grant_roster(auth.uid(), grant_id), which already resolves to
-- "curators/admins, or a member of that grant" (via user_can_edit_project →
-- is_curator_or_admin OR grant membership). This keeps SELECT symmetric with
-- INSERT/UPDATE/DELETE: you can read exactly the roster rows you are allowed to
-- modify. Admins/curators (the agent's onboarding path) can read all rosters.
--
-- KG project: vpexxhfpvghlejljwpvt. Idempotent (safe to re-run).
-- NOTE: the live KG schema has diverged from this repo (Lovable applies
-- migrations directly), so confirm there is no pre-existing SELECT policy before
-- relying on this — the DROP ... IF EXISTS below makes re-application safe either
-- way, and adding a permissive policy only ever broadens within this same
-- (already-authorized) audience.

DROP POLICY IF EXISTS "Curators admins and grant members can view roster" ON public.grant_investigators;
CREATE POLICY "Curators admins and grant members can view roster"
  ON public.grant_investigators FOR SELECT TO authenticated
  USING (public.user_can_edit_grant_roster(auth.uid(), grant_id));
