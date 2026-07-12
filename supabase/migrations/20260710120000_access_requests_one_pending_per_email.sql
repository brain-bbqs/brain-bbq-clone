-- Duplicate-request fix (two-path signup): the Globus sign-in path used to auto-file
-- a bare access_request AND the intake form filed another, producing two pending rows
-- per person. globus-auth no longer auto-files; the intake form is the single writer.
-- This migration (a) collapses any historical duplicate PENDING rows and (b) enforces
-- one pending request per email at the DB level.
--
-- KG migrations are NOT applied by `db push` — run this in the KG SQL editor
-- (project vpexxhfpvghlejljwpvt). Code degrades gracefully if it hasn't run yet:
-- the intake form treats a 23505 conflict as "already submitted".

-- 1) Keep the newest pending row per lower(email); dismiss the older duplicates.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(email)
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS rn
  FROM public.access_requests
  WHERE status = 'pending'
)
UPDATE public.access_requests a
   SET status = 'dismissed',
       review_notes = coalesce(a.review_notes || ' | ', '')
                      || 'Auto-dismissed duplicate pending request (kept newest for this email)'
  FROM ranked
 WHERE a.id = ranked.id
   AND ranked.rn > 1;

-- 2) At most one PENDING request per email (case-insensitive). A second submit for
--    the same person now raises unique_violation (23505), which the form catches.
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_one_pending_per_email
  ON public.access_requests (lower(email))
  WHERE status = 'pending';
