-- service_role bypasses RLS automatically; the policy was redundant and flagged by linter
DROP POLICY IF EXISTS "Service role can propose changes" ON public.pending_changes;