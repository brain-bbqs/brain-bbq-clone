# BBQS QA Plan — Source of Truth

Translated from the generic SaaS QA template to BBQS reality.
Stack: React/Vite/Tailwind/shadcn · Supabase (RLS) · Globus auth · Playwright.

**Status legend:** ✅ implemented · 🟡 partial · 🔴 todo · ⛔ N/A for BBQS

---

## 0. Auth & roles model (READ FIRST)

BBQS does NOT have email/password signup. The generic plan's `/login`,
`/register`, `/forgot-password`, `member` / `pi` / `admin` 4-user seed does
not apply. Our model:

| Plan concept | BBQS reality |
|---|---|
| `/login`, `/register` | Globus OAuth — `/auth` page + `/auth/callback`. No password. |
| Roles: `member`, `pi`, `admin` | `app_role` enum: `admin`, `member`. Stored in `user_roles`. Checked via `has_role(uid, role)`. |
| Test users (4) | 3 fixtures: **anon** (no JWT), **member**, **admin**. Seeded by `seed-staging-fakes` against the staging Supabase project only. |
| Fast auth for CI | `staging-fake-login` edge function (staging) and `ci-auth` edge function (any env, HMAC-gated). |
| "Forgot password" / "Change password" | ⛔ N/A. |

**Prod must never run seed-fake-login.** Triple-gated by `STAGING_MODE`,
`STAGING_SEED_TOKEN`, and a real-email detector.

---

## 1. Route inventory

Public (anon-readable):
`/`, `/about`, `/investigators`, `/principal-investigators`, `/projects`,
`/publications`, `/resources`, `/species`, `/working-groups`, `/announcements`,
`/job-board`, `/funding-opportunities`, `/calendar`, `/state-privacy-map`,
`/cross-species-synchronization`, `/mit-workshop-2026`, `/mit-workshop-travel`,
`/sfn-2025`, `/roadmap`, `/data-sharing-policy`, `/data-provenance`,
`/data-provenance-docs`, `/self-autonomy-docs`, `/mcp-docs`, `/mcp-tutorial`,
`/mcp-registry`, `/dandi-assistant`, `/tutorials`, `/feature-suggestions`.

Auth-required (member or admin):
`/profile`, `/projects/:id` edit mode, `/request-access`.

Admin-only:
`/admin`, `/admin/users`, `/admin/access-requests`.

Auth flow:
`/auth`, `/auth/callback`.

Catch-all: `/*` → `NotFound`.

---

## 2. Coverage matrix (translated sections)

### §1 Navigation — `e2e/navigation.spec.ts` 🟡
- [x] Sidebar links resolve (subset)
- [x] 404 catch-all
- [x] Investigator → entity-summary modal
- [ ] 🔴 `AppSidebar` collapse/expand state
- [ ] 🔴 Mobile hamburger (`use-mobile`) opens sheet
- [ ] 🔴 Admin-only sidebar items hidden for member
- [ ] 🔴 GlobalSearch opens via Cmd-K and routes
- [ ] 🔴 Header avatar dropdown (Profile / Sign out)

### §2 Auth — `e2e/auth.spec.ts` 🔴
Generic AUTH-001..012, REG-*, SESS-* are ⛔. Replacements:
- [ ] 🔴 `/auth` shows Globus button only
- [ ] 🔴 Anon hits `/profile` → redirect to `/auth`
- [ ] 🔴 Anon hits `/admin` → redirect to `/auth`
- [ ] 🔴 Member hits `/admin` → 403 / redirect home
- [ ] 🔴 `/auth/callback` handles success → home
- [ ] 🔴 `/auth/callback` handles `?error=...` gracefully (no crash)
- [ ] 🔴 Sign-out clears session and protected routes redirect
- [ ] 🔴 `ci-auth` edge function returns valid JWT for HMAC-signed payload, rejects unsigned
- [ ] 🔴 `staging-fake-login` rejected when `STAGING_MODE` unset

### §3 Homepage — `e2e/homepage.spec.ts` 🔴
- [ ] 🔴 Hero renders, single `<h1>`
- [ ] 🔴 Mission / Vision sections render
- [ ] 🔴 HomeSearch returns results across entity types
- [ ] 🔴 CTAs route correctly (Roadmap, Projects, etc.)
- [ ] 🔴 Footer links resolve, external open in new tab

### §4 Investigators directory — `e2e/investigators.spec.ts` 🟡
- [x] Renders rows (data-integrity)
- [x] Anon SELECT on `investigators_public` (api-health)
- [x] PII columns never leaked (api-health)
- [ ] 🔴 Search/filter inputs filter the grid
- [ ] 🔴 Card click opens EntitySummaryModal with tabs populated
- [ ] 🔴 Mobile viewport falls back to `MobileCardList`
- [ ] 🔴 Sort by name / institution

### §5 Projects — `e2e/projects.spec.ts` 🟡
- [x] Grid renders (data-integrity)
- [ ] 🔴 Tab switching (active / completed / etc.)
- [ ] 🔴 ProjectCard click opens detail / modal
- [ ] 🔴 ProjectProfile edit gated by `useCanEditProject` (linked email only)
- [ ] 🔴 `useMetadataEditor` save persists; non-owner save → 403
- [ ] 🔴 Curation undo restores prior value

### §6 Datasets / Uploads ⛔
No end-user upload UI. Replaced by:
- [ ] 🔴 Resources page renders, filters work
- [ ] 🔴 `useResources` hook returns expected shape

### §7 Tools catalog ⛔
Replaced by `/mcp-registry`:
- [ ] 🔴 Cards render
- [ ] 🔴 External docs/repo links open in new tab with `rel="noopener"`
- [ ] 🔴 Access-gated tools show `AccessGate` for anon

### §8 Announcements — `e2e/announcements.spec.ts` 🔴
- [x] Anon SELECT (api-health)
- [ ] 🔴 Card click opens detail
- [ ] 🔴 Draft/unpublished items invisible to anon (RLS)
- [ ] 🔴 Funding announcements separated from grants (memory rule)

### §9 Profile — `e2e/profile.spec.ts` 🔴
- [ ] 🔴 Anon → redirect to `/auth`
- [ ] 🔴 Member sees own profile + linked grants only
- [ ] 🔴 Identity-linked email grants edit on owned grants
- [ ] 🔴 Member cannot see another user's `/profile`
- [ ] 🔴 Onboarding modal shows for first-time user, dismiss persists in localStorage

### §10 Admin — `e2e/admin.spec.ts` 🔴
- [ ] 🔴 `/admin` requires `has_role(uid,'admin')`
- [ ] 🔴 AdminAccessRequests list loads, approve mutates `user_roles`
- [ ] 🔴 AdminUsers list loads
- [ ] 🔴 AdminConsole pages render

### §11 RLS — `e2e/rls-writes.spec.ts` 🔴
`api-health` covers anon SELECT. Missing write-path coverage:
- [ ] 🔴 Anon UPDATE/INSERT/DELETE on every public table → 401/403
- [ ] 🔴 Member cannot UPDATE another user's row in `feature_suggestions`, `entity_comments`
- [ ] 🔴 Member cannot INSERT into `user_roles` (no privilege escalation)
- [ ] 🔴 Member cannot UPDATE `grants` they're not linked to
- [ ] 🔴 Linked-email member CAN update grants they own
- [ ] 🔴 Anon cannot read raw `investigators` (PII) — covered ✅
- [ ] 🔴 Anon cannot read `jobs` directly, only `public_jobs` view
- [ ] 🔴 No `service_role` JWT in client bundle

### §12 Edge functions — `e2e/edge-functions.spec.ts` 🔴
Smoke + abuse-rejection for each:
- [ ] 🔴 `assistant-router` 200 on valid payload, rejects oversized prompt
- [ ] 🔴 `discovery-chat` rate-limited per `_shared/security.ts`
- [ ] 🔴 `nih-reporter-search` returns paginated results
- [ ] 🔴 `nih-grants`, `nih-pi-grants` return expected schema
- [ ] 🔴 `globus-auth` rejects bad code
- [ ] 🔴 `ci-auth` HMAC validation
- [ ] 🔴 `bbqs-api` and `bbqs-mcp` schema-stable
- [ ] 🔴 `github-roadmap` returns milestones
- [ ] 🔴 `elevenlabs-conversation-token` requires auth
- [ ] 🔴 `report-critical-error` accepts payload, scrubs PII
- [ ] 🔴 `state-privacy-scan` returns matrix

### §12b Toasts — `e2e/toasts.spec.ts` 🔴
- [ ] 🔴 Save success toast on metadata edit
- [ ] 🔴 Error toast on failed save
- [ ] 🔴 Auto-dismiss after timeout
- [ ] 🔴 Manual close via X

### §13 Modals & dialogs — `e2e/modals.spec.ts` 🔴
- [ ] 🔴 Escape closes EntitySummaryModal
- [ ] 🔴 Click outside closes (when not destructive confirm)
- [ ] 🔴 Tab focus trapped inside dialog
- [ ] 🔴 ReportIssueDialog submit flow

### §14 Form validation — covered inline per form 🔴

### §15 Accessibility — `e2e/a11y.spec.ts` 🔴
- [ ] 🔴 Install `@axe-core/playwright`
- [ ] 🔴 Axe scan on every public route, no critical/serious violations
- [ ] 🔴 Single `<h1>` per page (partly covered in console-errors)
- [ ] 🔴 Page title updates on route change
- [ ] 🔴 Skip-to-main link
- [ ] 🔴 Focus indicators visible

### §16 Direct Supabase API — `e2e/api-health.spec.ts` ✅ + extensions
- [x] Anon SELECT on every public table/view
- [x] PII guard on `investigators_public`
- [x] Anon blocked from raw `investigators`
- [ ] 🔴 Generalize PII guard: ANY `*_public` view scanned for `email|phone|ssn|dob` columns
- [ ] 🔴 Bundle scan: no `service_role` token in shipped JS

### §17 Cross-browser — `playwright.config.ts` 🔴
Currently chromium only. Add:
- [ ] 🔴 Firefox
- [ ] 🔴 WebKit
- [ ] 🔴 Mobile Chrome (Pixel 5)
- [ ] 🔴 Mobile Safari (iPhone 13)

### §18 SEO — `e2e/seo.spec.ts` 🔴
- [ ] 🔴 Every public route: `<title>` < 60 chars, `<meta description>` < 160
- [ ] 🔴 Single `<h1>`
- [ ] 🔴 `sitemap.xml` lists every public route
- [ ] 🔴 `robots.txt` allows crawl
- [ ] 🔴 Canonical link tag present
- [ ] 🔴 OG image resolves

### §19 Existing files (keep)
- ✅ `e2e/smoke.spec.ts` — h1 sanity
- ✅ `e2e/data-integrity.spec.ts` — empty-state guard on data pages
- ✅ `e2e/api-health.spec.ts` — anon SELECT contract + PII guard
- ✅ `e2e/console-errors.spec.ts` — JS errors / 4xx-5xx / broken images
- ✅ `e2e/navigation.spec.ts` — sidebar + 404 + entity modal
- ✅ `e2e/visual-regression.spec.ts` — screenshot baselines

---

## 3. Test ID convention (`data-testid`)

Format: `[component]-[role]-[action?]`

Highest-leverage components to seed first:

| Component | Test IDs to add |
|---|---|
| `Header` | `header-root`, `header-avatar`, `header-signout` |
| `AppSidebar` | `sidebar-root`, `sidebar-toggle`, `sidebar-link-{slug}` |
| `EntitySummaryModal` | `entity-modal`, `entity-modal-close`, `entity-modal-tab-{name}` |
| `MobileCardList` row | `mobile-card`, `mobile-card-link` |
| AG Grid wrapper | `data-grid-{entity}`, `data-grid-empty`, `data-grid-row` |
| `ReportIssueDialog` | `report-dialog`, `report-submit`, `report-cancel` |
| `GlobalSearch` | `global-search-input`, `global-search-result` |
| `OnboardingModal` | `onboarding-modal`, `onboarding-dismiss` |
| `AccessGate` | `access-gate`, `access-gate-cta` |
| Toasts (sonner) | already exposes `role="status"`; no testid needed |

---

## 4. Auth fixture contract (`e2e/helpers/auth.ts`)

Exports:

```ts
export const test = base.extend<{
  anonPage: Page;     // no auth
  memberPage: Page;   // member role JWT injected
  adminPage: Page;    // admin role JWT injected
}>({...});
```

Token source (in order of preference):
1. **Local / staging:** POST `staging-fake-login` with `{user:'admin'|'member'}`.
2. **CI against prod:** POST `ci-auth` with HMAC of `CI_AUTH_SECRET`.
3. **Fallback:** skip the test with `test.skip(!token, 'no auth available')`.

JWT injected via `page.addInitScript` setting `localStorage` keys
`sb-<ref>-auth-token` matching the Supabase v2 client format.

---

## 5. Phased rollout

- **Phase 1 — this doc.** Source of truth lives in `docs/QA_PLAN.md`. ✅
- **Phase 2 — foundations.** `@axe-core/playwright`, multi-browser projects,
  `e2e/helpers/auth.ts` fixture, seed `data-testid` on the components in §3.
- **Phase 3 — coverage PRs**, in priority order:
  1. `auth.spec.ts` + `rls-writes.spec.ts` (security ROI)
  2. `edge-functions.spec.ts`
  3. `entity-summary.spec.ts` + `investigators.spec.ts` extensions
  4. `homepage.spec.ts` + `search.spec.ts`
  5. `admin.spec.ts` + `profile.spec.ts`
  6. `a11y.spec.ts` + `seo.spec.ts`
  7. `toasts.spec.ts` + `modals.spec.ts`

Each Phase 3 PR must:
- Run green on chromium **and** Firefox + mobile.
- Add the new spec to `.github/workflows/qa.yml` "functional & API health" stage.
- Update the relevant checkbox in §2 of this file from 🔴 → ✅.

---

## 6. Known constraints (do not violate)

- Globus is the only auth provider. No email/password tests, no Supabase
  Auth UI tests, no `/login` or `/register` routes.
- Fake users only exist in the staging Supabase project. Never seed prod.
- Tests must not call `service_role`. Anon key + (member|admin) JWTs only.
- RLS write tests must clean up after themselves — every INSERT followed by
  DELETE in `test.afterEach`.
- Visual regression baselines auto-update on first run, then enforce.
