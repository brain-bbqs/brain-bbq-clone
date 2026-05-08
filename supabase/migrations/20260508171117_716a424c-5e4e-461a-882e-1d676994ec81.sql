-- ───────────────────────── 1. Drop unused PII columns ─────────────────────────
ALTER TABLE public.announcements DROP COLUMN IF EXISTS posted_by_email;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS posted_by_email;

-- ───────────────────────── 2. Tighten curation_audit_log SELECT ───────────────
DROP POLICY IF EXISTS "Authenticated can view curation audit log" ON public.curation_audit_log;
CREATE POLICY "Curators admins or actor can view curation audit log"
  ON public.curation_audit_log
  FOR SELECT
  TO authenticated
  USING (
    public.is_curator_or_admin(auth.uid())
    OR actor_id = auth.uid()
  );

-- ───────────────────────── 3. Tighten edit_history SELECT ────────────────────
DROP POLICY IF EXISTS "Authenticated users can view edit history" ON public.edit_history;
CREATE POLICY "Editors curators or self can view edit history"
  ON public.edit_history
  FOR SELECT
  TO authenticated
  USING (
    public.is_curator_or_admin(auth.uid())
    OR public.user_can_edit_project(auth.uid(), grant_number)
    OR edited_by = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- ───────────────────────── 4. neuromcp-audio storage UPDATE/DELETE ───────────
DROP POLICY IF EXISTS "Users can update own neuromcp audio" ON storage.objects;
CREATE POLICY "Users can update own neuromcp audio"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'neuromcp-audio' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'neuromcp-audio' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own neuromcp audio" ON storage.objects;
CREATE POLICY "Users can delete own neuromcp audio"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'neuromcp-audio' AND (auth.uid())::text = (storage.foldername(name))[1]);