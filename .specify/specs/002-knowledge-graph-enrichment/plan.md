# 002 — Knowledge Graph Enrichment · Plan

## Architecture
- Reuse existing `resources`, `devices`, and `resource_links` tables.
- Extend `device-manuals-discovery` edge function to close the manual-coverage gap.
- New `experiment_recipes` table: `{ id, title, goal, species[], device_stack (jsonb), wiring_notes, gotchas[], sources[] }`.

## UI
- New tab on `/resources/devices`: **Recipes**.
- Recipe detail page: `/resources/devices/recipes/:id` — shows device stack (linked to device profiles), wiring diagram slot, gotchas.
- Contribute-a-gotcha inline form on device detail (member-authenticated).

## Boundaries
- Recipes are curator-approved; member contributions land in a `pending_review` bucket.