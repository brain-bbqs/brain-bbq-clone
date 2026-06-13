-- Settings (singleton)
CREATE TABLE public.harvester_settings (
  id int PRIMARY KEY DEFAULT 1,
  beam_width int NOT NULL DEFAULT 3,
  targets_per_relation int NOT NULL DEFAULT 20,
  max_hops int NOT NULL DEFAULT 4,
  chain_score_threshold double precision NOT NULL DEFAULT 0.15,
  max_replans int NOT NULL DEFAULT 3,
  max_publications_per_seed int NOT NULL DEFAULT 120,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT harvester_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.harvester_settings TO anon, authenticated;
GRANT ALL ON public.harvester_settings TO service_role;
ALTER TABLE public.harvester_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.harvester_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.harvester_settings FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid())) WITH CHECK (public.is_curator_or_admin(auth.uid()));
INSERT INTO public.harvester_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Approved relation vocabulary
CREATE TABLE public.harvester_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  src_node_type text NOT NULL,
  dst_node_type text NOT NULL,
  fetcher_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  approved_by uuid,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.harvester_relations TO anon, authenticated;
GRANT ALL ON public.harvester_relations TO service_role;
ALTER TABLE public.harvester_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relations public read" ON public.harvester_relations FOR SELECT USING (true);
CREATE POLICY "relations admin write" ON public.harvester_relations FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid())) WITH CHECK (public.is_curator_or_admin(auth.uid()));

INSERT INTO public.harvester_relations (name, src_node_type, dst_node_type, fetcher_key, description) VALUES
  ('similar_to', 'grant', 'grant', 'similar_to', 'NIH RePORTER similar_projects'),
  ('has_investigator', 'grant', 'investigator', 'has_investigator', 'Grant PI/co-PI roster'),
  ('co_pi_on', 'investigator', 'grant', 'co_pi_on', 'Other grants this investigator works on'),
  ('produced', 'grant', 'publication', 'produced', 'Publications produced by this grant'),
  ('cites', 'publication', 'publication', 'cites_icite', 'Publications cited by this pub (NIH iCite)'),
  ('cited_by', 'publication', 'publication', 'cited_by_icite', 'Publications citing this pub (NIH iCite)'),
  ('describes', 'publication', 'methods_evidence', 'describes', 'Methods extraction from this publication'),
  ('uses_hardware', 'methods_evidence', 'resource', 'uses_hardware', 'Hardware referenced in methods evidence'),
  ('funded_by_org', 'grant', 'organization', 'funded_by_org', 'Awarding/recipient organization'),
  ('affiliated_with', 'investigator', 'organization', 'affiliated_with', 'Investigator affiliation'),
  ('r61_pair', 'grant', 'grant', 'r61_pair', 'R61 ↔ R34 companion grant pairing');

-- Proposed (unapproved) relations queue
CREATE TABLE public.proposed_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relation_name text NOT NULL,
  src_node_type text,
  dst_node_type text,
  seed_grant_number text,
  planner_rationale text,
  example_edge jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.proposed_relations TO authenticated;
GRANT ALL ON public.proposed_relations TO service_role;
ALTER TABLE public.proposed_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposed admin read" ON public.proposed_relations FOR SELECT TO authenticated
  USING (public.is_curator_or_admin(auth.uid()));
CREATE POLICY "proposed admin write" ON public.proposed_relations FOR ALL TO authenticated
  USING (public.is_curator_or_admin(auth.uid())) WITH CHECK (public.is_curator_or_admin(auth.uid()));

-- Traversal paths (provenance)
CREATE TABLE public.grant_methods_traversal_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_grant_number text NOT NULL,
  path jsonb NOT NULL,
  chain_score double precision NOT NULL DEFAULT 0,
  terminal_evidence_id uuid REFERENCES public.grant_methods_evidence(id) ON DELETE SET NULL,
  planner_model text,
  replan_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grant_methods_traversal_paths_seed_idx ON public.grant_methods_traversal_paths(seed_grant_number);
GRANT SELECT ON public.grant_methods_traversal_paths TO anon, authenticated;
GRANT ALL ON public.grant_methods_traversal_paths TO service_role;
ALTER TABLE public.grant_methods_traversal_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paths public read" ON public.grant_methods_traversal_paths FOR SELECT USING (true);

-- Link evidence to its discovery path
ALTER TABLE public.grant_methods_evidence
  ADD COLUMN IF NOT EXISTS discovery_path_id uuid REFERENCES public.grant_methods_traversal_paths(id) ON DELETE SET NULL;