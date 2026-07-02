# 003 — Forum · Plan

## Data
- `forum_threads (id, author_id, title, body, tags[], pinned, created_at, updated_at)`
- `forum_posts (id, thread_id, author_id, body, ai_suggested, ratified_by, created_at)`
- `forum_ai_suggestions (id, thread_id, draft_body, sources jsonb, confidence, status)`
- RLS: read = any authenticated member; write = author for their own posts.

## Edge functions
- `forum-ai-suggest` — triggered on new thread; drafts a reply citing consortium resources via RAG over the existing embeddings.

## UI
- `/forum` — thread list with tag filters.
- `/forum/:threadId` — thread view with AI suggestion panel visible to poster + admins.

## Rollout
1. Threads + posts (no AI).
2. AI suggestion panel (admins-only visible first).
3. Poster-visible AI suggestions.
4. Anonymized digest → newsletter integration.