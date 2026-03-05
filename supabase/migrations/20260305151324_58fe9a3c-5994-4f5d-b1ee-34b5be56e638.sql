
-- Entity comments table for all resource types
CREATE TABLE public.entity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES public.entity_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_entity_comments_resource ON public.entity_comments(resource_id);
CREATE INDEX idx_entity_comments_user ON public.entity_comments(user_id);
CREATE INDEX idx_entity_comments_parent ON public.entity_comments(parent_id);

-- RLS
ALTER TABLE public.entity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view entity comments"
  ON public.entity_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.entity_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.entity_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.entity_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_entity_comments_updated_at
  BEFORE UPDATE ON public.entity_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
