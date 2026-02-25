-- Add chat_context column to edit_history to store the conversation that initiated the change
ALTER TABLE public.edit_history ADD COLUMN chat_context jsonb DEFAULT NULL;