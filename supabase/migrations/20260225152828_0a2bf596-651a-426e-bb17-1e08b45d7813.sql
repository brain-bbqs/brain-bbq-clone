
CREATE TABLE IF NOT EXISTS public.edit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  grant_number TEXT NOT NULL,
  edited_by TEXT NOT NULL DEFAULT 'anonymous',
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_edit_history_project ON public.edit_history(project_id);
CREATE INDEX idx_edit_history_grant ON public.edit_history(grant_number);
CREATE INDEX idx_edit_history_created ON public.edit_history(created_at DESC);

ALTER TABLE public.edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view edit history" ON public.edit_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert edit history" ON public.edit_history FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE edit_history;
