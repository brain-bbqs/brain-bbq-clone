# Database Schema — Resource-Centric Architecture (COMPLETE)

## Relationship Graph

### 1. Tenants & Users
```
profiles.id                → auth.users.id
profiles.organization_id   → organizations.id
allowed_domains.organization_id → organizations.id
```

### 2. Core Knowledge Graph
Every domain table has an optional `resource_id → resources.id` FK:
- `organizations.resource_id`
- `projects.resource_id`
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

### 4. Multi-Tenant Scoping
`organization_id → organizations.id` on:
- `projects`
- `resources`
- `chat_conversations`
- `announcements`
- `jobs`
- `feature_suggestions`
- `analytics_pageviews`
- `analytics_clicks`

### 5. Application Features
- `entity_comments` (resource_id → resources, user_id, parent_id → self)
- `chat_conversations` (user_id, organization_id) → `chat_messages` (conversation_id)
- `feature_suggestions` (submitted_by, organization_id) → `feature_votes` (suggestion_id)
- `announcements` / `jobs` (resource_id, posted_by, organization_id)

### 6. Reference & Embeddings
- `knowledge_embeddings` (resource_id → resources, source_type, source_id)
- `taxonomies`, `ontology_standards`, `custom_field_usage`, `edit_history`, `search_queries`

## Tables Dropped
| Table | Reason |
|---|---|
| `paper_extractions` | Dropped; metadata lives in projects.metadata JSONB |
| `nih_grants_cache` | Redundant; grants table + NIH Reporter API |
| `nih_grants_sync_log` | Operational logging only |
| `extraction_corrections` | Depended on paper_extractions |

## Migrations Completed
1. Dropped unused tables
2. Consolidated projects array columns → `metadata` JSONB
3. Simplified edit_history
4. Added `resource_id` to projects
5. Added `organization_id` to 8 feature/scoping tables (including projects, resources)
6. Replaced `grant_investigators.grant_number` with `grant_id`
7. Relaxed `grant_number` uniqueness on projects
8. Ensured all FK constraints exist across all tables

## Remaining Work
- Backfill `projects.resource_id` and `projects.organization_id`
- Backfill `resources.organization_id`
- Tighten RLS policies (20 warnings for overly permissive `true` checks)
