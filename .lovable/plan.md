# Live Knowledge-Graph Harvester — Plan

Four coordinated additions to turn the multi-hop harvester into an always-on, watchable, curatable pipeline.

## 1. Animal & device facet in the extractor

Extend `harvest-grant-methods-multihop` extractor JSON with:
- `species[]` — e.g. `mouse`, `rat`, `nhp_macaque`, `human_adult`, `human_pediatric`
- `behavior_paradigm[]` — e.g. `open_field`, `freely_moving`, `head_fixed_treadmill`, `lick_task`, `social_interaction`, `clinical_outcome_scale`
- `device_class[]` — coarse buckets: `ephys_headstage`, `silicon_probe`, `miniscope`, `fiber_photometry`, `optogenetics`, `iEEG_clinical`, `sEEG_clinical`, `DBS_clinical`, `EEG_scalp`, `wearable_actigraphy`
- `subject_n` — integer when extractable

Also add a coarse `study_arm` field (`animal_model` vs `clinical_translational`) so animal R34 sites and human R61 sites can be cross-referenced.

DB: add these as columns on `grant_methods_evidence` (text[] / jsonb), backfill nullable.

## 2. New heatmap view: Org × Device-class

In `AdminKgHeatmap`, add a third switchable axis pair:
- Rows: organization
- Cols: `device_class`
- Cell color: count × avg chain-score
- Filters: species, study_arm (animal/clinical), R-mechanism (R61/R34)
- Click cell → drawer listing source grants + PMIDs + extracted methods snippet

Bridge badge: when an org appears in both an `animal_model` row and a `clinical_translational` row for the same `device_class` (or a mapped equivalent), flag the cell as a *translational bridge* with an orange ring.

## 3. Live graph view of the harvester running

New page `/admin/kg-live`:
- Force-directed graph (d3-force) of nodes added in the last N minutes
- Node shapes: grant (square), publication (circle), org (diamond), device_class (hex)
- Edge labels: relation name + hop score
- Realtime via Supabase Realtime subscription on `grant_methods_traversal_paths` (insert) and `grant_methods_evidence` (insert)
- Side panel: current batch status — seeds queued / in-progress / done, current hop, current PMID being scraped
- Sparkline of pubs-extracted-per-minute, Firecrawl calls/min, error rate

Requires a new lightweight table `harvester_runs` (run_id, seed, phase, current_hop, started_at, finished_at, error, counters) updated by the multihop function at hop boundaries.

## 4. Always-on background runner (Firecrawl-friendly throttle)

Replace the manual "Start batch" with a cron-scheduled tick:
- New edge function `harvester-tick` runs every 5 min via `pg_cron` + `pg_net`
- Picks the next seed grant from a queue table `harvester_queue` (priority + last_run_at), respects a per-tick budget (e.g. 1 seed/tick, max 20 Firecrawl scrapes)
- Re-enqueues seeds with a `cool_down_hours` after a successful run (default 72h) so the graph keeps refreshing without hammering Firecrawl
- Global kill-switch + concurrency=1 lock in `harvester_settings`
- Admin console gets: queue table, pause/resume toggle, manual "bump priority" button per seed

## 5. Keyword tracker + relationship curation

New table `harvester_keywords` (term, kind, frequency, first_seen_at, last_seen_at, status: `auto`/`approved`/`rejected`).

- Extractor writes every novel device/behavior/species term into this table with a frequency counter
- Curator UI at `/admin/kg-curate`:
  - Tab 1: **Keywords** — review novel terms, merge synonyms (e.g. `2-photon` → `two_photon_imaging`), promote to canonical vocabulary
  - Tab 2: **Relations** — review `proposed_relations` the planner suggested but weren't in the vocabulary; approve to extend the planner's allowed set
  - Tab 3: **Evidence rows** — flag wrong extractions; flagged rows get re-run on next tick
- Synonyms file lives in DB (`harvester_synonyms` table) so the extractor prompt can include it at run time

## Technical details

**Migrations**
- `grant_methods_evidence`: add `species text[]`, `behavior_paradigm text[]`, `device_class text[]`, `subject_n int`, `study_arm text`
- New: `harvester_runs`, `harvester_queue`, `harvester_keywords`, `harvester_synonyms`
- All admin/curator gated via existing `is_curator_or_admin`
- Enable Realtime publication on `grant_methods_evidence`, `grant_methods_traversal_paths`, `harvester_runs`

**Edge functions**
- Modify: `harvest-grant-methods-multihop` (richer extractor JSON, write `harvester_runs` ticks, write keywords)
- New: `harvester-tick` (cron-driven queue worker)
- Keep: `harvest-grants-batch` for one-off manual bursts

**Cron**
- `pg_cron` schedule `*/5 * * * *` → `harvester-tick`
- Will be installed via `supabase--insert` (not migration) since the URL+anon-key are project-specific

**Frontend**
- New pages: `/admin/kg-live`, `/admin/kg-curate`
- Heatmap page gets Org×Device axis + bridge logic
- Realtime hook using `supabase.channel(...).on('postgres_changes', ...)`
- d3-force already pairs well; alternative is `react-force-graph` if you'd prefer (lighter to wire)

## Build order
1. Migrations (facet columns, runs/queue/keywords/synonyms tables, realtime publication)
2. Extractor upgrade + keyword writes
3. `harvester-tick` + cron
4. `/admin/kg-live` realtime view
5. Heatmap Org×Device axis + bridge badges
6. `/admin/kg-curate` console

## Open questions
- Cool-down default — 72h per seed OK, or want faster (24h) / slower (weekly)?
- Force-graph library — d3-force (more control) vs react-force-graph (faster to ship)?
- Curator console: should "approve keyword" auto-merge into all existing evidence rows, or only affect future extractions?