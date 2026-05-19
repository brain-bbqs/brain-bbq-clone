# BBQS QA Plan — Technical Reference

Engineer-facing spec: route inventory, E2E coverage matrix, test ID conventions,
auth fixture contract, and phased rollout plan.
Stack: React/Vite/Tailwind/shadcn · Supabase (RLS) · Globus auth · Playwright.

**Status legend:** ✅ implemented · 🟡 partial · 🔴 todo · ⛔ N/A for BBQS

**Current release: v1.0.0** (feature-locked May 15, 2026)

---

## Changelog

| Version | Date | Summary |
|---|---|---|
| **v1.0.0** | 2026-05-15 | Feature lock. Continuous scroll, resource/publication write forms, auth gates, entity deep links, E2E CI green. |
| pre-v1 | 2026-05-10 | Initial QA plan drafted. |

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

## 1. Route inventory (v1.0.0)

### Public (anon-readable)
`/`, `/about`, `/investigators`, `/projects`, `/publications`, `/resources`,
`/species`, `/working-groups`, `/announcements`, `/jobs`, `/grants`,
`/suggest-feature`, `/tutorials`, `/data-sharing-policy`, `/state-privacy`,
`/mcp-docs`, `/mcp-tutorial`, `/sfn-2025`, `/mit-workshop-2026`.

### Auth-required (member or admin)
`/profile`, `/calendar`, `/mit-workshop-2026/travel`, `/roadmap`.

> **v1.0.0 change:** Calendar is now auth-gated (contains privileged
> consortium scheduling information). Roadmap is auth-gated (internal planning).

### Auth-required — disabled / not-yet-ready
`/data-provenance` — sidebar item is greyed out (`disabled: true`). Page exists
but loads no usable content; hidden pending data pipeline work.

### Admin-only
`/admin` (AdminConsole — `adminOnly: true` in sidebar config).

### Auth flow
`/auth`, `/auth/callback`.

### Hidden / removed in v1.0.0
- `/cross-species-synchronization` — removed from sidebar; not production-ready.
- `/principal-investigators` — superseded by `/investigators`.
- `/data-provenance-docs`, `/self-autonomy-docs`, `/mcp-registry`,
  `/dandi-assistant` — routes may exist in code but are not linked in the
  sidebar for v1.0.0.

### Catch-all
`/*` → `NotFound`.

---

## 2. Coverage matrix

### §1 Navigation — `e2e/navigation.spec.ts` 🟡
- [x] Sidebar links resolve: Projects, People, Publications, Resources, Species
- [x] 404 catch-all
- [x] Investigator row click → `EntitySummaryModal` opens (`data-testid="entity-summary-panel"`)
- [ ] 🔴 `AppSidebar` collapse/expand state persists
- [ ] 🔴 Mobile hamburger (`use-mobile`) opens sheet
- [ ] 🔴 Admin-only sidebar items hidden for member user
- [ ] 🔴 `disabled` sidebar items (Data Provenance) are not clickable
- [ ] 🔴 `authRequired` items (Calendar, Roadmap) redirect anon to `/auth`
- [ ] 🔴 GlobalSearch opens via Cmd-K and routes
- [ ] 🔴 Header avatar dropdown (Profile / Sign out)

### §2 Auth — `e2e/auth.spec.ts` 🔴
Generic AUTH-001..012, REG-*, SESS-* are ⛔. Replacements:
- [ ] 🔴 `/auth` shows Globus button only
- [ ] 🔴 Anon hits `/profile` → redirect to `/auth`
- [ ] 🔴 Anon hits `/admin` → redirect to `/auth`
- [ ] 🔴 Anon hits `/calendar` → redirect to `/auth` (v1.0.0 gate)
- [ ] 🔴 Anon hits `/roadmap` → redirect to `/auth`
- [ ] 🔴 Member hits `/admin` → 403 / redirect home
- [ ] 🔴 `/auth/callback` handles success → home
- [ ] 🔴 `/auth/callback` handles `?error=...` gracefully (no crash)
- [ ] 🔴 Sign-out clears session and protected routes redirect
- [ ] 🔴 `ci-auth` edge function returns valid JWT for HMAC-signed payload, rejects unsigned
- [ ] 🔴 `staging-fake-login` rejected when `STAGING_MODE` unset
- [ ] 🔴 Cross-origin auth cookie set correctly (regression: fixed 2026-05-16)

### §3 Homepage — `e2e/homepage.spec.ts` 🔴
- [ ] 🔴 Hero renders, single `<h1>`
- [ ] 🔴 Mission / Vision sections render
- [ ] 🔴 HomeSearch returns results across entity types
- [ ] 🔴 CTAs route correctly (Roadmap, Projects, etc.)
- [ ] 🔴 Footer links resolve, external open in new tab

### §4 Investigators / People — `e2e/investigators.spec.ts` 🟡
- [x] Grid renders rows (data-integrity)
- [x] Anon SELECT on `investigators_public` (api-health)
- [x] PII columns (`email`, `phone`) never leaked via `investigators_public` (api-health)
- [x] Row click → `EntitySummaryModal` opens with `data-testid="entity-summary-panel"` (navigation)
- [x] **`?q=` deep link**: `/investigators?q=Jane+Smith` auto-opens entity summary for matching investigator (v1.0.0)
- [ ] 🔴 `?q=` with no match → grid shows no auto-open, no crash
- [ ] 🔴 Search/filter input filters the grid live
- [ ] 🔴 Column sort (all columns sortable in v1.0.0)
- [ ] 🔴 Mobile viewport falls back to `MobileCardList`
- [ ] 🔴 EntitySummaryModal: Escape key closes, click-outside closes

### §5 Projects — `e2e/projects.spec.ts` 🟡
- [x] Grid renders rows (data-integrity)
- [x] All rows load without pagination — continuous scroll (v1.0.0)
- [ ] 🔴 Column sort (enabled v1.0.0)
- [ ] 🔴 ProjectCard click opens detail / modal
- [ ] 🔴 ProjectProfile edit gated by `useCanEditProject` (linked email only)
- [ ] 🔴 `useMetadataEditor` save persists; non-owner save → 403
- [ ] 🔴 Add-project-by-grant-number UI (added v1.0.0): grant number lookup → pre-fill
- [ ] 🔴 Curation undo restores prior value

### §6 Publications — `e2e/publications.spec.ts` 🟡
- [x] Grid renders rows (data-integrity)
- [x] All rows load without pagination — continuous scroll (v1.0.0)
- [x] **Add Publication dialog**: member-gated; submits to `pending_writes` review queue (v1.0.0)
- [ ] 🔴 Add Publication dialog: anon / non-member does not see button
- [ ] 🔴 Add Publication dialog: form validation (required fields)
- [ ] 🔴 Column sort (enabled v1.0.0)
- [ ] 🔴 Publication chip → external DOI / PubMed opens in new tab

### §7 Resources — `e2e/resources.spec.ts` 🟡
- [x] Grid renders rows (data-integrity)
- [x] All rows load without pagination — continuous scroll (v1.0.0)
- [x] **Add Resource dialog**: curator-gated; submits to `pending_writes` review queue (v1.0.0)
- [x] Resource categories restructured: Software · Datasets · Models · Protocols · Benchmarks (v1.0.0)
- [ ] 🔴 Add Resource dialog: non-curator does not see button
- [ ] 🔴 Add Resource dialog: form validation
- [ ] 🔴 Category filter chips filter the grid
- [ ] 🔴 Column sort (enabled v1.0.0)
- [ ] 🔴 External URL chip opens in new tab with `rel="noopener"`

### §8 Species — `e2e/species.spec.ts` 🟡
- [x] Grid renders rows (data-integrity)
- [x] All rows load without pagination — continuous scroll (v1.0.0)
- [x] **Species count consistency**: UI count matches `species` table row count — `e2e/species-count-consistency.spec.ts` (added v1.0.0)
- [ ] 🔴 Column sort (enabled v1.0.0)
- [ ] 🔴 Species chip → EntitySummaryModal

### §9 Announcements — `e2e/announcements.spec.ts` 🔴
- [x] Anon SELECT (api-health)
- [ ] 🔴 Card click opens detail
- [ ] 🔴 Draft/unpublished items invisible to anon (RLS)

### §10 Jobs / Opportunities — `e2e/jobs.spec.ts` 🔴
- [x] Grid renders (data-integrity implied)
- [ ] 🔴 **Add Opportunity dialog**: member-gated modal (added v1.0.0); anon does not see button
- [ ] 🔴 External apply URL opens in new tab
- [ ] 🔴 Expired/closed postings filtered out

### §11 Profile — `e2e/profile.spec.ts` 🔴
- [ ] 🔴 Anon → redirect to `/auth`
- [ ] 🔴 Member sees own profile + linked grants only
- [ ] 🔴 Identity-linked email grants edit on owned grants
- [ ] 🔴 Member cannot see another user's `/profile`
- [ ] 🔴 Onboarding modal shows for first-time user, dismiss persists in localStorage

### §12 Admin — `e2e/admin.spec.ts` 🔴
- [ ] 🔴 `/admin` requires `has_role(uid,'admin')`
- [ ] 🔴 AdminAccessRequests list loads, approve mutates `user_roles`
- [ ] 🔴 AdminUsers list loads
- [ ] 🔴 AdminConsole pages render

### §13 Theme — `e2e/theme.spec.ts` 🔴
New in v1.0.0: dark mode is the default; theme toggle lives in sidebar.
- [ ] 🔴 Default theme on fresh load is dark
- [ ] 🔴 Toggle switches to light; preference persists in `localStorage`
- [ ] 🔴 Table contrast meets WCAG AA in both light and dark (regression: fixed 2026-05-16)
- [ ] 🔴 System preference (`prefers-color-scheme`) respected before any user action

### §14 RLS — `e2e/rls-writes.spec.ts` 🔴
`api-health` covers anon SELECT. Missing write-path coverage:
- [ ] 🔴 Anon UPDATE/INSERT/DELETE on every public table → 401/403
- [ ] 🔴 Member cannot UPDATE another user's row in `feature_suggestions`, `entity_comments`
- [ ] 🔴 Member cannot INSERT into `user_roles` (no privilege escalation)
- [ ] 🔴 Member cannot UPDATE `grants` they're not linked to
- [ ] 🔴 Linked-email member CAN update grants they own
- [ ] 🔴 Anon cannot read raw `investigators` (PII) — covered ✅
- [ ] 🔴 Anon cannot read `jobs` directly, only `public_jobs` view
- [ ] 🔴 No `service_role` JWT in client bundle
- [ ] 🔴 Security definer views verified (regression: two misconfigurations fixed 2026-05-16)

### §15 Edge functions — `e2e/edge-functions.spec.ts` 🔴
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

### §16 Toasts — `e2e/toasts.spec.ts` 🔴
- [ ] 🔴 Save success toast on metadata edit
- [ ] 🔴 Error toast on failed save (e.g. Add Publication with duplicate DOI)
- [ ] 🔴 Auto-dismiss after timeout
- [ ] 🔴 Manual close via X

### §17 Modals & dialogs — `e2e/modals.spec.ts` 🔴
- [x] EntitySummaryModal renders (`data-testid="entity-summary-panel"`)
- [ ] 🔴 Escape closes EntitySummaryModal
- [ ] 🔴 Click outside closes EntitySummaryModal
- [ ] 🔴 Back navigation in stacked modal (breadcrumb)
- [ ] 🔴 Tab focus trapped inside dialog
- [ ] 🔴 Add Resource / Add Publication dialogs open and close correctly
- [ ] 🔴 Add Opportunity dialog (Jobs page) open/close

### §18 Form validation — covered inline per form 🔴
- [ ] 🔴 Add Resource: required fields enforced before submit
- [ ] 🔴 Add Publication: DOI format validated
- [ ] 🔴 Add Opportunity: URL fields validated

### §19 Accessibility — `e2e/a11y.spec.ts` 🔴
- [ ] 🔴 Install `@axe-core/playwright`
- [ ] 🔴 Axe scan on every public route, no critical/serious violations
- [ ] 🔴 Single `<h1>` per page (partly covered in console-errors)
- [ ] 🔴 Page title updates on route change
- [ ] 🔴 Skip-to-main link
- [ ] 🔴 Focus indicators visible in both light and dark mode

### §20 Direct Supabase API — `e2e/api-health.spec.ts` ✅ + extensions
- [x] Anon SELECT on all public tables/views
- [x] PII guard on `investigators_public` (email/phone columns absent)
- [x] Anon blocked from raw `investigators`
- [x] Non-existent tables removed from test surface (`working_groups`, `resource_links` were phantom tables — fixed v1.0.0)
- [x] `analytics_pageviews` 401 correctly excluded (auth-gated by design)
- [ ] 🔴 Generalize PII guard: ANY `*_public` view scanned for `email|phone|ssn|dob` columns
- [ ] 🔴 Bundle scan: no `service_role` token in shipped JS

### §21 Cross-browser — `playwright.config.ts` 🔴
Currently chromium only. Add:
- [ ] 🔴 Firefox
- [ ] 🔴 WebKit
- [ ] 🔴 Mobile Chrome (Pixel 5)
- [ ] 🔴 Mobile Safari (iPhone 13)

### §22 SEO — `e2e/seo.spec.ts` 🔴
- [ ] 🔴 Every public route: `<title>` < 60 chars, `<meta description>` < 160
- [ ] 🔴 Single `<h1>`
- [ ] 🔴 `sitemap.xml` lists every public route
- [ ] 🔴 `robots.txt` allows crawl of public routes, blocks auth/admin
- [ ] 🔴 Canonical link tag present
- [ ] 🔴 OG image resolves

### §23 Existing E2E specs (keep green)
- ✅ `e2e/smoke.spec.ts` — h1 sanity on public routes
- ✅ `e2e/data-integrity.spec.ts` — AG Grid renders ≥1 row on all data pages
- ✅ `e2e/api-health.spec.ts` — anon SELECT contract + PII guard
- ✅ `e2e/console-errors.spec.ts` — JS errors / 4xx-5xx / broken images (same-origin only)
- ✅ `e2e/navigation.spec.ts` — sidebar links + 404 + entity summary modal
- ✅ `e2e/visual-regression.spec.ts` — screenshot baselines
- ✅ `e2e/species-count-consistency.spec.ts` — UI count matches DB count (added v1.0.0)

---

## 3. Test ID convention (`data-testid`)

Format: `[component]-[role]-[action?]`

Seeded in v1.0.0:

| Component | Test ID |
|---|---|
| `EntitySummaryModal` panel | `entity-summary-panel` ✅ |

Still needed (highest leverage):

| Component | Test IDs to add |
|---|---|
| `Header` | `header-root`, `header-avatar`, `header-signout` |
| `AppSidebar` | `sidebar-root`, `sidebar-toggle`, `sidebar-link-{slug}` |
| `EntitySummaryModal` close/back | `entity-modal-close`, `entity-modal-back` |
| `MobileCardList` row | `mobile-card`, `mobile-card-link` |
| AG Grid wrapper | `data-grid-{entity}`, `data-grid-empty`, `data-grid-row` |
| Add Resource dialog | `add-resource-dialog`, `add-resource-submit` |
| Add Publication dialog | `add-publication-dialog`, `add-publication-submit` |
| Add Opportunity dialog | `add-opportunity-dialog`, `add-opportunity-submit` |
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
  1. `auth.spec.ts` + `rls-writes.spec.ts` (security ROI; covers new Calendar / Roadmap gates)
  2. `edge-functions.spec.ts`
  3. `investigators.spec.ts` extensions (deep link `?q=`, sort, mobile)
  4. `publications.spec.ts` + `resources.spec.ts` (write-form flows)
  5. `jobs.spec.ts` (Add Opportunity dialog)
  6. `theme.spec.ts` (dark mode default, toggle persistence)
  7. `homepage.spec.ts` + `search.spec.ts`
  8. `admin.spec.ts` + `profile.spec.ts`
  9. `a11y.spec.ts` + `seo.spec.ts`
  10. `toasts.spec.ts` + `modals.spec.ts`

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
- Same-origin rule for broken-image checks: external CDN images (Clearbit
  logos, etc.) are excluded from the broken-image assertion in CI.
- `analytics_pageviews` 401 is expected — table is auth-gated by design.
  Exclude from `failedRequests` filter.
