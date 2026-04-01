
-- Phase 1: Drop unused tables (with CASCADE for dependent views)
DROP VIEW IF EXISTS public.correction_pattern_summary;
DROP TABLE IF EXISTS public.extraction_corrections;
DROP TABLE IF EXISTS public.nih_grants_sync_log;
