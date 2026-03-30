
-- ============================================================
-- Phase A: Drop paper_extractions (user confirmed drop)
-- ============================================================
DROP TABLE IF EXISTS public.paper_extractions;

-- Drop nih_grants_cache (redundant)
DROP TABLE IF EXISTS public.nih_grants_cache;

-- ============================================================
-- Phase B: Add resource_id to projects
-- ============================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES public.resources(id);

-- ============================================================
-- Phase C: Add organization_id to feature tables
-- ============================================================
ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.feature_suggestions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.analytics_pageviews
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.analytics_clicks
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- ============================================================
-- Phase D: Fix grant_investigators FK (grant_number → grant_id)
-- ============================================================
ALTER TABLE public.grant_investigators
  ADD COLUMN IF NOT EXISTS grant_id uuid REFERENCES public.grants(id);

-- Backfill grant_id from grants table
UPDATE public.grant_investigators gi
SET grant_id = g.id
FROM public.grants g
WHERE g.grant_number = gi.grant_number
  AND gi.grant_id IS NULL;

-- ============================================================
-- Phase E: Relax grant_number uniqueness on projects
-- ============================================================
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_grant_number_key;

-- ============================================================
-- Phase F: Add resource_id to paper_extractions replacement (paper_extractions already dropped)
-- No action needed.
-- ============================================================
