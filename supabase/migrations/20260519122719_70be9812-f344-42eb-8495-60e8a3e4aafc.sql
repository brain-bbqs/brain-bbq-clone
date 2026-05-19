CREATE TABLE public.data_policy_quiz_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_id text NOT NULL,
  answer text NOT NULL CHECK (answer IN ('yes','no','unsure')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.data_policy_quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz answers"
  ON public.data_policy_quiz_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz answers"
  ON public.data_policy_quiz_responses FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own quiz answers"
  ON public.data_policy_quiz_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz answers"
  ON public.data_policy_quiz_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz answers"
  ON public.data_policy_quiz_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_data_policy_quiz_responses_updated_at
  BEFORE UPDATE ON public.data_policy_quiz_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_data_policy_quiz_responses_user ON public.data_policy_quiz_responses(user_id);