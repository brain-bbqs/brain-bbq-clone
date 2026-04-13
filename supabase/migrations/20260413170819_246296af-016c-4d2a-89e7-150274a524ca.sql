
-- =============================================
-- Phase 4: RLS Policy Tightening
-- Change Roles: {public} → {authenticated} on write policies
-- and restrict profiles SELECT to own row
-- =============================================

-- ─── entity_comments ─────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.entity_comments;
CREATE POLICY "Authenticated users can insert comments"
  ON public.entity_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.entity_comments;
CREATE POLICY "Users can update their own comments"
  ON public.entity_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.entity_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.entity_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── feature_suggestions ─────────────────────
DROP POLICY IF EXISTS "Authenticated can insert suggestions" ON public.feature_suggestions;
CREATE POLICY "Authenticated can insert suggestions"
  ON public.feature_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── feature_votes ───────────────────────────
DROP POLICY IF EXISTS "Authenticated can insert votes" ON public.feature_votes;
CREATE POLICY "Authenticated can insert votes"
  ON public.feature_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON public.feature_votes;
CREATE POLICY "Users can delete own votes"
  ON public.feature_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── resources ───────────────────────────────
DROP POLICY IF EXISTS "Authenticated can insert resources" ON public.resources;
CREATE POLICY "Authenticated can insert resources"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own resources" ON public.resources;
CREATE POLICY "Users can update own resources"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- ─── chat_conversations ──────────────────────
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can create their own conversations"
  ON public.chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can update their own conversations"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can delete their own conversations"
  ON public.chat_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── chat_messages ───────────────────────────
DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;
CREATE POLICY "Users can create their own messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
CREATE POLICY "Users can view their own messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── profiles (fix email exposure) ──────────
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ─── investigators ───────────────────────────
DROP POLICY IF EXISTS "Users can update own investigator" ON public.investigators;
CREATE POLICY "Users can update own investigator"
  ON public.investigators FOR UPDATE
  TO authenticated
  USING (user_owns_investigator(auth.uid(), id))
  WITH CHECK (user_owns_investigator(auth.uid(), id));
