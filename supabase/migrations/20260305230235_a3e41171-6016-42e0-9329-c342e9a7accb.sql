ALTER TABLE public.edit_history
  ADD COLUMN IF NOT EXISTS validation_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS validation_protocols text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS validation_checks jsonb DEFAULT NULL;