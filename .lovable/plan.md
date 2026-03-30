# Database Refactoring Plan — Resource-Centric Architecture

## Guiding Principle
**Resources are the center of everything.** Every meaningful entity has a row in `resources`. Domain-specific tables extend it via `resource_id` FK. Tables not used in the UI get dropped.

---

## Phase 1: Drop Unused Tables

These tables have no meaningful frontend usage or can be removed without impact:

| Table | Reason to Drop |
|---|---|
| `nih_grants_sync_log` | Operational logging only; no UI reads it |
| `extraction_corrections` | Only used with paper_extractions flow |
| `nih_grants_cache` | Denormalized cache; grants table + NIH Reporter API serve this |

**Edge case:** `chat_conversations` + `chat_messages` are used on the Profile page to list past conversations. Decision needed: keep or drop the conversation history feature.

## Phase 2: Consolidate `paper_extractions` into `resources`

The Paper Extractor page uses `paper_extractions`. Refactor:
- Each extraction becomes a `resource` with `resource_type = 'publication'` (or a new type `'extraction'`).
- The many array columns (`use_sensors`, `use_approaches`, etc.) move into `metadata` JSONB.
- Keep: `id`, `user_id`, `filename`, `status`, `title`, `doi`, `storage_path`, `extracted_metadata`, `created_at`, `updated_at`.
- Drop the 12+ array columns and `raw_text`, `chat_messages`, `authors` (move to metadata).

## Phase 3: Simplify `projects` Table

Currently has 12+ array columns duplicating taxonomy structure. Consolidate:

**Keep as columns:** `id`, `grant_number`, `grant_id`, `study_species`, `study_human`, `keywords`, `website`, `metadata_completeness`, `metadata` (JSONB), `organization_id` (new), `created_at`, `updated_at`, `last_edited_by`.

**Move to `metadata` JSONB:** `use_approaches`, `use_sensors`, `produce_data_modality`, `produce_data_type`, `use_analysis_types`, `use_analysis_method`, `develope_software_type`, `develope_hardware_type`, `collaborators`, `presentations`, `related_project_ids`.

⚠️ This is the highest-risk change — the Metadata Assistant reads/writes these columns directly. Must update edge functions (`metadata-chat`, `metadata-suggest`, `gap-analysis`) and frontend (`MetadataTable`, project summaries).

## Phase 4: Fix `grant_investigators` FK

Replace `grant_number text` with `grant_id uuid REFERENCES grants(id)`:
1. Add `grant_id` column
2. Backfill from `grants` table
3. Drop `grant_number` column

## Phase 5: Add `organization_id` for Multi-Tenancy

Add `organization_id uuid REFERENCES organizations(id)` to:
- `projects`
- `resources` (already has `created_by`, but org scoping is cleaner)
- `jobs`
- `announcements`
- `feature_suggestions`

Update RLS policies to scope by organization where appropriate.

## Phase 6: Simplify `edit_history`

- Drop `validation_protocols text[]` (unused)
- Keep `validation_status` and `validation_checks jsonb`

## Phase 7: Clean Up Redundant Join Tables

Current state: `project_resources`, `project_publications`, AND `resource_links` all serve similar purposes.

**Decision:** Keep `project_resources` and `project_publications` for type-safe core relationships. Use `resource_links` only for ad-hoc/graph relationships. Document the distinction.

## Phase 8: Frontend Updates

For each schema change, update:
1. Edge functions that read/write affected columns
2. React hooks (`useMetadataChat`, `useEditHistory`, etc.)
3. Entity summary components
4. AG Grid column definitions

---

## Tables Inventory (Post-Refactor)

### Core (keep as-is or with minor changes)
- `resources` — central entity table
- `grants` — extends resources via resource_id
- `investigators` — extends resources via resource_id
- `organizations` — extends resources via resource_id
- `publications` — extends resources via resource_id
- `species` — extends resources via resource_id
- `software_tools` — extends resources via resource_id
- `profiles` — auth-linked user profiles
- `allowed_domains` — org domain mapping

### Relationships (keep)
- `grant_investigators` — grants ↔ investigators (fix FK)
- `investigator_organizations` — investigators ↔ orgs
- `project_resources` — projects ↔ resources
- `project_publications` — projects ↔ publications
- `resource_links` — polymorphic graph edges

### Feature-specific (keep)
- `projects` — project metadata (simplify columns)
- `edit_history` — audit trail (simplify)
- `entity_comments` — comments on any resource
- `funding_opportunities` — NOFOs
- `jobs` — job board
- `announcements` — news
- `feature_suggestions` + `feature_votes` — feature voting
- `analytics_pageviews` + `analytics_clicks` — usage tracking
- `state_privacy_rules` — privacy compliance map
- `knowledge_embeddings` — RAG vectors
- `ontology_standards` — reference ontologies
- `custom_field_usage` — taxonomy evolution tracking
- `taxonomies` — canonical vocabulary
- `search_queries` — search analytics
- `paper_extractions` — simplified (or merged into resources)

### Drop
- `nih_grants_cache` — redundant cache
- `nih_grants_sync_log` — operational only
- `extraction_corrections` — unused
- `chat_conversations` + `chat_messages` — TBD (used minimally on Profile page)

---

## Execution Order
1. Phase 1 (drop unused tables) — lowest risk
2. Phase 4 (fix grant_investigators FK) — data migration
3. Phase 6 (simplify edit_history) — minor
4. Phase 5 (add organization_id) — additive, no breakage
5. Phase 2 (consolidate paper_extractions) — moderate risk
6. Phase 3 (simplify projects) — highest risk, most code changes
7. Phase 7 (document join table strategy)
8. Phase 8 (frontend updates per phase)
