
-- 1. Atomic vote increment/decrement functions
CREATE OR REPLACE FUNCTION public.increment_vote_count(_suggestion_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE feature_suggestions
  SET votes = votes + 1
  WHERE id = _suggestion_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_vote_count(_suggestion_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE feature_suggestions
  SET votes = GREATEST(votes - 1, 0)
  WHERE id = _suggestion_id;
$$;

-- 2. Make neuromcp-audio bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'neuromcp-audio';

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Public read access for neuromcp-audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read neuromcp-audio" ON storage.objects;

-- Owner-scoped read policy
CREATE POLICY "Users can read their own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'neuromcp-audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Tighten permissive RLS policies

-- Species: remove permissive INSERT/UPDATE for authenticated, restrict to service_role
DROP POLICY IF EXISTS "Authenticated users can insert species" ON public.species;
DROP POLICY IF EXISTS "Authenticated users can update species" ON public.species;

CREATE POLICY "Service role can insert species"
  ON public.species FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update species"
  ON public.species FOR UPDATE
  TO service_role
  USING (true);

-- Custom field usage: restrict INSERT/UPDATE to service_role
DROP POLICY IF EXISTS "Authenticated can insert custom field usage" ON public.custom_field_usage;
DROP POLICY IF EXISTS "Authenticated can update custom field usage" ON public.custom_field_usage;

CREATE POLICY "Service role can insert custom field usage"
  ON public.custom_field_usage FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update custom field usage"
  ON public.custom_field_usage FOR UPDATE
  TO service_role
  USING (true);

-- Taxonomies: restrict INSERT to service_role
DROP POLICY IF EXISTS "Authenticated users can insert taxonomies" ON public.taxonomies;

CREATE POLICY "Service role can insert taxonomies"
  ON public.taxonomies FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Investigators: tighten INSERT to require user matching
DROP POLICY IF EXISTS "Authenticated users can insert investigators" ON public.investigators;

CREATE POLICY "Service role can insert investigators"
  ON public.investigators FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4. Auth audit log: service role only
CREATE POLICY "Service role can view audit log"
  ON public.auth_audit_log FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert audit log"
  ON public.auth_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 5. Revoke public execute on SECURITY DEFINER functions, grant to authenticated
REVOKE EXECUTE ON FUNCTION public.user_owns_investigator(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_investigator(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_can_edit_project(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_edit_project(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_owns_resource(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_resource(uuid, uuid) TO authenticated;
