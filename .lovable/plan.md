# Database Schema — Resource-Centric Architecture

## Relationship Graph (Post-Refactor)

### 1. Tenants & Users
```
profiles.id                → auth.users.id
profiles.organization_id   → organizations.id
allowed_domains.organization_id → organizations.id
```

### 2. Core Knowledge Graph
Every domain table has an optional `resource_id → resources.id` FK:
- `organizations.resource_id`
- `projects.resource_id` ← NEW
- `grants.resource_id`
- `publications.resource_id`
- `software_tools.resource_id`
- `species.resource_id`
- `investigators.resource_id`

Generic graph edges: `resource_links (source_id, target_id → resources.id)`

### 3. Core Scientific Relationships
```
projects.grant_id               → grants.id
project_publications (project_id → projects.id, publication_id → publications.id)
project_resources    (project_id → projects.id, resource_id → resources.id)
grant_investigators  (grant_id → grants.id, investigator_id → investigators.id)
investigator_organizations (investigator_id → investigators.id, organization_id → organizations.id)
```

### 4. Application Features
All scoped by `organization_id → organizations.id`:
- `chat_conversations` (user_id, organization_id)
- `chat_messages` (conversation_id → chat_conversations.id)
- `announcements` (resource_id, posted_by, organization_id)
- `jobs` (resource_id, posted_by, organization_id)
- `feature_suggestions` (submitted_by, organization_id)
- `feature_votes` (user_id, suggestion_id)
- `entity_comments` (resource_id, user_id, parent_id)
- `analytics_pageviews` (user_id, organization_id)
- `analytics_clicks` (user_id, organization_id)

### 5. Reference & Embeddings
- `knowledge_embeddings` (resource_id, source_type, source_id)
- `taxonomies` (category, value, parent_value)
- `ontology_standards` (category, name)
- `custom_field_usage` (field_name, field_value)
- `edit_history` (project_id, grant_number, field_name)
- `search_queries` (query, mode)

---

## Tables Dropped
| Table | Reason |
|---|---|
| `paper_extractions` | Feature removed; user confirmed drop |
| `nih_grants_cache` | Redundant cache; grants table + NIH Reporter API serve this |
| `nih_grants_sync_log` | Operational logging only |
| `extraction_corrections` | Only used with paper_extractions |

## Migrations Completed
1. Dropped unused tables (nih_grants_sync_log, extraction_corrections)
2. Consolidated projects array columns → `metadata` JSONB
3. Consolidated paper_extractions array columns → `extracted_metadata` JSONB
4. Simplified edit_history (dropped validation_protocols)
5. **Dropped paper_extractions and nih_grants_cache**
6. **Added `resource_id` to projects**
7. **Added `organization_id` to chat_conversations, announcements, jobs, feature_suggestions, analytics_pageviews, analytics_clicks**
8. **Added `grant_id` to grant_investigators (backfilled from grants table)**
9. **Relaxed `grant_number` uniqueness on projects**

## Remaining Work
- Backfill `projects.resource_id` from resources table
- Backfill `organization_id` on feature tables from profiles
- Eventually drop `grant_investigators.grant_number` after full code migration to `grant_id`
- Tighten RLS policies (many are overly permissive with `true`)
