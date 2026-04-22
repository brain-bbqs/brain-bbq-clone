---
name: Curation Undo System
description: Universal undo for all curation writes via curation_audit_log + revert_curation_change RPC, exposed as inline Undo toasts and per-row Revert buttons in Data Provenance.
type: feature
---
Every curation write (project metadata via manual editor or Metadata Assistant chat, team roster add/update/remove, pending_changes accept, entity comments add/delete) records a row in `curation_audit_log` with `before_value` / `after_value` snapshots.

Undo paths:
- **Inline toast** (10s) appears immediately after each save with an "Undo" action that calls `revert_curation_change(audit_id)`.
- **Per-row Revert** in `/data-provenance` next to any historical edit that has a matching audit row (matched by grant_number+field_name within ±30s of edit_history timestamp).

Revert is gated by `user_can_revert_audit`: same edit-permission rules as the original action (project editors for project_metadata/team_roster/pending_change_decision, investigator owners for investigator edits, comment author for entity_comment, admins/curators for everything).

Reverts themselves are logged as new `is_revert=true` rows so undo-of-undo works. Time window: forever (full history).

Metadata-chat returns `audit_ids[]` so the chat UI can pop an Undo toast for assistant-applied edits.
