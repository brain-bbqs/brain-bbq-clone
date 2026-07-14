
-- Drop the old LIWC-based instrumentation entirely
DROP TRIGGER IF EXISTS trg_ir_enqueue_grants ON public.grants;
DROP TRIGGER IF EXISTS trg_ir_enqueue_publications ON public.publications;
DROP TRIGGER IF EXISTS trg_ir_enqueue_entity_comments ON public.entity_comments;
DROP TRIGGER IF EXISTS trg_ir_enqueue_feature_suggestions ON public.feature_suggestions;
DROP SCHEMA IF EXISTS internal_research CASCADE;
DROP FUNCTION IF EXISTS public.ir_list_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.ir_consortium_trend() CASCADE;
DROP FUNCTION IF EXISTS public.ir_snapshot_now() CASCADE;

-- New: per-investigator personality scores using Big Five + HEXACO adjective lexicons
-- (Roivainen 2022; AoA-weighted). Admin-only.
CREATE TABLE public.personality_scores (
  investigator_id uuid PRIMARY KEY REFERENCES public.investigators(id) ON DELETE CASCADE,
  big_five jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { e, a, c, s, o } 0..1 weighted trait score
  hexaco   jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { h, e, x, a, c, o }
  token_count int NOT NULL DEFAULT 0,
  matched_count int NOT NULL DEFAULT 0,
  top_adjectives jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{adj, count, factor_bf, factor_hx}]
  last_computed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.personality_scores TO authenticated;
GRANT ALL ON public.personality_scores TO service_role;
ALTER TABLE public.personality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view personality scores"
  ON public.personality_scores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages personality scores"
  ON public.personality_scores FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
