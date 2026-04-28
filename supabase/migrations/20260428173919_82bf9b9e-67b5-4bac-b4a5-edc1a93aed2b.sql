-- Drop functions that depend on the tables first
DROP FUNCTION IF EXISTS public.accept_pending_change(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.backfill_chat_history_from_sources() CASCADE;
DROP FUNCTION IF EXISTS public.chat_backfill_hash120(text) CASCADE;

-- Drop assistant-only tables
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.pending_changes CASCADE;
DROP TABLE IF EXISTS public.custom_field_usage CASCADE;