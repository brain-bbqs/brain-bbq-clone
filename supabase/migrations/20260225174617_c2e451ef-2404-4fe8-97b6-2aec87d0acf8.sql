
-- Feature suggestions table to track user requests
CREATE TABLE public.feature_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_by_email text,
  github_issue_number integer,
  github_issue_url text,
  status text NOT NULL DEFAULT 'open',
  votes integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature suggestions"
  ON public.feature_suggestions FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert suggestions"
  ON public.feature_suggestions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update suggestions"
  ON public.feature_suggestions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Track who voted to prevent double-voting
CREATE TABLE public.feature_votes (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suggestion_id uuid REFERENCES public.feature_suggestions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, suggestion_id)
);

ALTER TABLE public.feature_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.feature_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert votes"
  ON public.feature_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.feature_votes FOR DELETE
  USING (auth.uid() = user_id);
