-- Onboarding tracking columns for investigators and projects.
-- Enables the BBQS agent to track per-step onboarding progress
-- and surface a pipeline dashboard to admins.

-- ============================================================
-- investigators: onboarding checklist + completion timestamp
-- ============================================================
ALTER TABLE public.investigators
  ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.investigators.onboarding_checklist IS
  'JSON object tracking per-step onboarding status. Keys: pre_check, welcome_email, kg_created, pi_group, consortium_group, wg_groups, data_questionnaire, slack. Values: not_started | pending | done | skipped';

COMMENT ON COLUMN public.investigators.onboarding_completed_at IS
  'Set when all required onboarding steps are done. NULL = onboarding still in progress.';

-- ============================================================
-- projects: project-level onboarding status
-- ============================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed', 'archived'));

COMMENT ON COLUMN public.projects.onboarding_status IS
  'Lifecycle stage of project onboarding. Updated as investigators and questionnaire are completed.';

-- ============================================================
-- Index: fast lookup of incomplete onboardings
-- ============================================================
CREATE INDEX IF NOT EXISTS investigators_onboarding_incomplete_idx
  ON public.investigators (created_at DESC)
  WHERE onboarding_completed_at IS NULL;
