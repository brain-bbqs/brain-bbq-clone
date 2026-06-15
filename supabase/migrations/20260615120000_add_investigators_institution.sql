-- Add an `institution` column to investigators.
--
-- The agent (onboarding-form import, the member self-onboarding wizard, and
-- resolveGrant) reads/writes an investigator's home institution, but no such
-- column existed on `investigators` — only `access_requests.institution` (the
-- pre-signup request form). Code that queried `investigators.affiliation`
-- errored on an unknown column. Standardise on `institution` (matching
-- access_requests) and add it here so those paths work.
--
-- Idempotent and additive: no RLS change is needed (existing investigators
-- policies are row-scoped and cover all columns). Existing rows get NULL.

ALTER TABLE public.investigators
  ADD COLUMN IF NOT EXISTS institution text;
