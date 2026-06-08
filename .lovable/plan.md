# Multi-Hop KG Reasoning for Grant Methods Harvester

Extend the existing `harvest-grant-methods` edge function from fixed depth-2 BFS over `similar_projects` into a **multi-hop, plan-then-traverse reasoning engine** that discovers new relationships as it goes — modeled on Plan-on-Graph / Think-on-Graph, but using a single-call LLM planner + embedding-guided pruning so we don't pay an LLM call per hop.

## Decisions (locked in)

- **Citations source:** NIH iCite (free, good coverage, no key).
- **Relation vocabulary:** fixed. The planner may **not** invent new relations on the fly. Any candidate new relation is logged to a `proposed_relations` table for admin review; only admin-approved relations enter the live vocabulary.
- **Beam defaults:** `B=3`, `M=20`, `max_hops=4`. Stored in `budget_config`-style settings table so admins can tweak per-seed or globally without redeploying.

## Graph model

Nodes (from existing tables):
- `grant` (`grants`)
- `investigator` (`investigators`)
- `publication` (`publications`, PMID)
- `organization` (`organizations`)
- `resource` (`resources`)
- `methods_evidence` (`grant_methods_evidence`, already populated for depth 0–2)

Fixed relation vocabulary `R` (admin-managed):
- `grant -[similar_to]-> grant` (NIH RePORTER `similar_projects`)
- `grant -[has_investigator]-> investigator`
- `investigator -[co_pi_on]-> grant`
- `grant -[produced]-> publication`
- `publication -[cites]-> publication` (NIH iCite)
- `publication -[cited_by]-> publication` (NIH iCite reverse)
- `publication -[describes]-> methods_evidence`
- `methods_evidence -[uses_hardware]-> resource`
- `grant -[funded_by_org]-> organization`
- `investigator -[affiliated_with]-> organization`
- `grant -[r61_pair]-> grant` (R61 ↔ R34 paired companion grants, derived from grant_number prefix swap)

## Algorithm

Per the paper: one planner LLM call, then embedding-guided beam BFS, no further LLM calls except the existing extractor on reached publications.

1. **Plan** — one `gemini-3-flash` call per seed grant. Inputs: seed abstract, intent ("find hardware, stim params, recording params used across related projects, especially R61↔R34 pairs and clinical trials"), the approved relation vocabulary, `max_hops=4`. Structured output: `{ "hops": [["has_investigator","r61_pair"], ["co_pi_on","produced"], ["produced","cites"], ["describes"]] }`.
2. **Traverse** — BFS frontier restricted to planned relations at each hop. Per hop:
   - Pull candidate edges from Postgres or NIH RePORTER / iCite on demand.
   - **Embedding-guided pruning:** embed seed-grant abstract + per-edge text (relation + target summary) via Lovable AI embeddings (`google/gemini-embedding-001`, cached in `knowledge_embeddings`). Score = cosine similarity. Keep top-`B` relations × top-`M` targets per relation.
   - Chain score = product of per-hop cosine scores; prune paths below a configurable threshold.
3. **Extract** — for any `publication` reached, run the existing Firecrawl + Methods-section + structured-extraction path (already implemented). Skip already-extracted PMIDs.
4. **Replan (capped)** — if a hop returns < N viable expansions or all chain scores collapse, fire **one** additional planner call passing the discovered subgraph summary. Hard cap: 3 replans per seed.
5. **Proposed relations** — if the planner emits a relation outside vocabulary, the function does **not** traverse it. It writes a row to `proposed_relations` (relation name, example src/dst nodes, planner rationale) for admin approval in the UI.

## Data model changes

New tables:

`harvester_settings` (singleton config, admin-editable):
- `id int pk default 1`, `beam_width int default 3`, `targets_per_relation int default 20`,
  `max_hops int default 4`, `chain_score_threshold float default 0.15`,
  `max_replans int default 3`, `max_publications_per_seed int default 120`,
  `updated_at`, `updated_by`.

`harvester_relations` (admin-managed vocabulary):
- `id uuid pk`, `name text unique`, `src_node_type text`, `dst_node_type text`,
  `fetcher_key text` (which internal neighbor-fetcher to call), `enabled bool default true`,
  `description text`, `approved_by`, `approved_at`.

`proposed_relations` (planner suggestions awaiting admin approval):
- `id uuid pk`, `relation_name text`, `src_node_type text`, `dst_node_type text`,
  `seed_grant_number text`, `planner_rationale text`, `example_edge jsonb`,
  `status text default 'pending'` (`pending`/`approved`/`rejected`),
  `reviewed_by`, `reviewed_at`, `created_at`.

`grant_methods_traversal_paths`:
- `id uuid pk`, `seed_grant_number text`,
- `path jsonb` — ordered `[{node_type, node_id, relation_in, hop, score}]`,
- `chain_score float`,
- `terminal_evidence_id uuid references grant_methods_evidence(id) null`,
- `planner_model text`, `replan_count int default 0`,
- `created_at timestamptz default now()`.

Alter `grant_methods_evidence`:
- add `discovery_path_id uuid references grant_methods_traversal_paths(id) null`.

RLS: public read on `harvester_relations`, `grant_methods_traversal_paths`; admin-only write on settings/relations/proposed; service-role write on paths and evidence. All tables get explicit GRANTs.

## Edge function changes

Refactor `supabase/functions/harvest-grant-methods/index.ts` into modules:
- `planner.ts` — single `gemini-3-flash` structured-output call; validates returned relations against `harvester_relations`; logs unknowns to `proposed_relations`.
- `relations/` — one neighbor-fetcher per `fetcher_key` (`similar_to`, `cites_icite`, `co_pi_on`, etc.). iCite uses `https://icite.od.nih.gov/api/pubs?pmids=...`.
- `scorer.ts` — embedding cache (writes through to `knowledge_embeddings`) + cosine scoring + beam pruning.
- `traversal.ts` — generic frontier expansion, chain-score pruning, replan trigger.
- `extractor.ts` — existing Methods scrape + structured extract, unchanged.

Idempotency: `(seed, path_signature)` for paths; existing `(seed, source, pmid)` for evidence. Hard wall-clock: 90 s per seed; resume via cron.

## UI changes

On `/grants/:grantNumber/methods-evidence`:
- Mode selector on the **Run harvest** button: `Depth-2 (current)` | `Multi-hop reasoning (new)`.
- New tab **Discovery paths** — each `grant_methods_traversal_paths` row as a horizontal hop chain (node badges, relation-labeled arrows), grouped/sortable by chain score.
- Each evidence card gains a **Found via** expander showing its discovery path.

New admin-only page `/admin/harvester`:
- Edit `harvester_settings` (beam width, M, max hops, threshold, etc.).
- Manage `harvester_relations` (enable/disable, descriptions).
- Review `proposed_relations` queue: approve → inserts into `harvester_relations`; reject → marks rejected.

## Rollout

1. Migration: new tables, new column, RLS, GRANTs; seed `harvester_relations` with the vocabulary above and `harvester_settings` with defaults `B=3, M=20, hops=4`.
2. Refactor edge function behind a `mode` flag; old depth-2 path stays as default until validated.
3. Run multi-hop mode on CMIE seed `1R61MH138612-01`; inspect paths + evidence in UI.
4. Backfill across all R61/R34 grants once CMIE looks clean.
