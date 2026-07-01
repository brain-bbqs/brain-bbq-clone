ALTER TABLE public.harvester_runs
  ADD COLUMN IF NOT EXISTS hops_taken int,
  ADD COLUMN IF NOT EXISTS hop_similarities jsonb,
  ADD COLUMN IF NOT EXISTS similar_projects_visited int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_hops_configured int;

UPDATE public.harvester_settings
  SET max_hops = 5
  WHERE id = 1 AND (max_hops IS NULL OR max_hops < 5);

COMMENT ON COLUMN public.grant_methods_evidence.environment_tags IS
  'Free-form environment/context tags emitted by the extractor. Common values (operating_room, home_cage, freely_moving_arena, field_recording, wildlife_collar, virtual_reality, computational_only, etc.) are suggestions, not a fixed vocabulary.';