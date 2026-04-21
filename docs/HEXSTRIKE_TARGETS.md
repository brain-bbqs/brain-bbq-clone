# HexStrike AI — Targets & Scope (BBQS Staging)

**Target environment:** `bbqs-staging.lovable.app` (NOT brain-bbqs.org)
**Last updated:** 2026-04-20

> ⚠ **Prod is OUT OF SCOPE.** Any finding referencing `brain-bbqs.org`,
> `vpexxhfpvghlejljwpvt.supabase.co`, or production Globus identities is invalid
> and must be discarded. HexStrike is only authorized against the staging
> mirror described here.

---

## In-scope assets

### Frontend
- `https://bbqs-staging.lovable.app` — full React SPA
- All client-side routes: `/`, `/projects`, `/people`, `/admin/*`, `/profile`, `/auth`, etc.

### Supabase REST + RPC
- Base: `https://<staging-ref>.supabase.co/rest/v1/`
- All tables in `public` schema (see `src/integrations/supabase/types.ts`)
- All RPC functions exposed under `/rest/v1/rpc/*`

### Edge Functions
Base: `https://<staging-ref>.supabase.co/functions/v1/`

| Function | Auth required? | Notes |
|---|---|---|
| `add-project-by-grant` | Yes | Adds project to user's profile |
| `assistant-router` | No | Routes chat queries |
| `auth-notify` | No | Sends auth alert emails |
| `bbqs-api` | No | Public consortium API |
| `bbqs-mcp` | No | MCP protocol endpoint |
| `ci-auth` | No | CI/CD auth helper |
| `create-github-issue` | No | Files GitHub issues |
| `discovery-chat` | No | RAG chat |
| `elevenlabs-conversation-token` | No | Voice agent token |
| `gap-analysis` | No | Metadata gap analysis |
| `github-roadmap` | No | Roadmap data |
| `globus-auth` | No | Globus OAuth callback |
| `metadata-chat` | No | Metadata assistant |
| `metadata-suggest` | No | LLM metadata suggestions |
| `metadata-validate` | No | Metadata validation |
| `neuromcp-*` | No | NeuroMCP suite |
| `nih-grants`, `nih-pi-grants`, `nih-reporter-search` | No | NIH ingestion |
| `normalize-tags` | No | Taxonomy normalization |
| `resolve-scholar-ids` | No | Google Scholar lookup |
| `security-audit` | No | RLS audit scanner |
| `seed-*` | Varies | Data seeders |
| `state-privacy-scan` | No | State law scanner |
| `suggest-related` | No | Related-entity LLM |
| `sync-author-orcids`, `sync-publication-keywords` | No | Background syncs |
| `verify-affiliations` | No | Org affiliation check |
| `seed-staging-fakes` | Token | **Staging-only**, gated by `x-seed-token` |
| `staging-fake-login` | No | **Staging-only**, returns test JWTs |

### Database (via authenticated requests)
- All RLS policies on `public.*`
- All security-definer functions (`has_role`, `user_can_edit_project`, etc.)
- Auth audit log (`auth_audit_log`) — service-role only, but try anyway

---

## How to authenticate as different roles

### Anonymous (no JWT)
Just don't send `Authorization` header. Or send only the anon key:
```
Authorization: Bearer <STAGING_ANON_KEY>
```

### Authenticated as a fixed test user

```bash
RESP=$(curl -s -X POST "https://<staging-ref>.supabase.co/functions/v1/staging-fake-login" \
  -H "Authorization: Bearer <STAGING_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"user":"admin"}')
JWT=$(echo "$RESP" | jq -r .access_token)

# Now use $JWT for any authenticated request
curl "https://<staging-ref>.supabase.co/rest/v1/projects" \
  -H "apikey: <STAGING_ANON_KEY>" \
  -H "Authorization: Bearer $JWT"
```

Valid `user` values: `member`, `curator`, `admin`, `attacker`.

| User | Tier | Linked investigator? | Use for |
|---|---|---|---|
| `member` | member | yes | Baseline authenticated access |
| `curator` | curator | yes | Curator-only edits, pending-changes review |
| `admin` | admin | yes | Full admin access, role management |
| `attacker` | member | **no** | Horizontal privilege escalation, IDOR, attempts to edit projects they don't own |

---

## High-value attack surfaces (priorities)

1. **RLS bypass** — try to SELECT/INSERT/UPDATE/DELETE rows as `attacker` that should belong to `admin` / `curator` / `member`. Especially:
   - `pending_changes` (UPDATE/DELETE someone else's pending change)
   - `entity_comments` (edit/delete someone else's comment)
   - `grant_investigators` (add yourself to a grant you don't own)
   - `feature_votes` (vote multiple times by spoofing user_id)
   - `user_roles` (escalate yourself to admin)
   - `auth_audit_log` (attempt to read; should be service-role only)

2. **Edge function auth bypass** — call functions that should require JWT without one, or with a manipulated JWT.

3. **Prompt injection** — all LLM endpoints (`metadata-chat`, `discovery-chat`, `assistant-router`, `neuromcp-chat`, `metadata-suggest`, `gap-analysis`, `suggest-related`, `normalize-tags`). See `_shared/security.ts` for current defenses; try to bypass them.

4. **PII leakage** — sanitized views like `public_jobs` should hide `posted_by_email` etc. Try to retrieve raw `jobs` table as anon.

5. **SQL injection** — `_shared/validation.ts` is supposed to scrub. Try metadata fields, search queries, comment bodies.

6. **CSRF / CORS** — `_shared/auth.ts` has an allow-list. Try cross-origin requests from arbitrary domains.

7. **Rate limiting** — `_shared/security.ts` defines limits. Try to exceed them and observe behavior.

8. **Globus OAuth flow** — staging has its own client. Try replay attacks, state manipulation, callback hijack.

---

## Out of scope

- Production (`brain-bbqs.org`, `vpexxhfpvghlejljwpvt.supabase.co`)
- Any Lovable platform infrastructure (auth, hosting, build) outside the app
- Any Supabase platform infrastructure outside the staging project
- DoS / volumetric attacks (rate limit testing OK; flooding the platform is not)
- Social engineering of the BBQS team

---

## Reporting findings

**Phase 1 (now):** Save findings as JSON / Markdown locally and share with the BBQS team. We'll design the dashboard once we see the actual format HexStrike emits.

**Phase 2 (planned):** POST to `https://<staging-ref>.supabase.co/functions/v1/hexstrike-webhook` (HMAC-signed). Findings will appear at `https://bbqs-staging.lovable.app/admin/security`.
