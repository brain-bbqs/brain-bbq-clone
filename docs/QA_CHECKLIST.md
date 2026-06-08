# BBQS QA Checklist — v1.1.0

Hands-on QA walkthrough for the BBQS app **plus** the source of truth for
the Playwright suite in `e2e/qa-checklist.spec.ts`. Every section here has
a matching `test.describe("§N ...")` block in that spec file. Most of those
blocks ship as a **skeleton with `test.todo(...)` placeholders** — your job
is to fill them in as you QA.

## How to work this document

For **each section** below, do the following loop:

1. **Manual pass.** Open the BBQS preview (or staging URL) and the section
   in your editor side-by-side. Click through every checkbox item and tick
   `[ ]` → `[x]` as you confirm it.
2. **Write the Playwright test.** Open `e2e/qa-checklist.spec.ts`, find the
   matching `test.describe("§N ...")` block, and convert every `test.todo`
   into a real `test(...)` that asserts the same thing your manual click
   just confirmed. **One checkbox = one `test()`** (or one `expect` inside
   a grouped test — see §2 for the pattern).
3. **Run just that section** while iterating:
   ```bash
   npx playwright test e2e/qa-checklist.spec.ts -g "§<section-number>"
   ```
4. **Bug? Don't make the test pass anyway.** File a GitHub issue using the
   template in §99, link it from the checkbox like `[x] (bug #149)`, and
   leave the failing test in place with a `test.fail(...)` annotation and
   a `// bug #149` comment so CI tracks the regression.
5. **Whole section green?** Move to the next one. When everything is green,
   run the full suite:
   ```bash
   npx playwright test e2e/qa-checklist.spec.ts
   ```

## How to add a Playwright test for a checkbox

The spec file's header has the full helper reference. Quick version:

```ts
// 1. find the section block
test.describe("§4 investigators", () => {
  // 2. replace a `test.todo("...")` with a real test
  test("grid renders at least one row", async ({ page }) => {
    await gotoOk(page, "/investigators");
    await expect(page.locator(".ag-row").first()).toBeVisible();
  });
});
```

Rules of thumb:

- Use the `gotoOk(page, path)` helper — it waits for `networkidle` and fails
  on console errors automatically.
- Prefer role-based locators (`getByRole`, `getByText`) over CSS selectors.
  Only fall back to `data-testid` when the role/text isn't unique. New
  `data-testid` hooks belong on the component, not invented in the test.
- Auth-gated routes (§13, §14, §17, §18) are **anon-only** in this suite:
  assert the redirect to `/auth`. Member/admin coverage lives in the
  fixture suites — out of scope for this pass.
- External links: assert both `href` matches and `target="_blank"` +
  `rel="noopener"`.
- If a check needs new test infra (fixtures, network mocks, seeded data),
  leave the `test.todo` in place and add a `// needs: <thing>` comment.
  Flag it in standup rather than building infra solo.

## Environments

| Env           | URL                              | Auth                                                       |
| ------------- | -------------------------------- | ---------------------------------------------------------- |
| Local preview | `http://localhost:8080`          | preview-mode bypass, you are signed in as `Preview User`   |
| Staging       | `https://staging.brain-bbqs.org` | `staging-fake-login` edge function (admin/member fixtures) |
| Prod          | `https://brain-bbqs.org`         | Globus OAuth — **DO NOT submit test data here**            |

Run all manual + automated QA against **staging** unless told otherwise.

## Open GitHub issues this pass should cover

Issues `#81`–`#148` are in scope for this round. Highlights:

- `#81` dark mode toggle (sidebar)
- `#82` auto-feedback should post as bot user
- `#83` SVG vector logo asset
- `#84` Get-Started Step 5 wording
- … see the full list on GitHub. Each section below calls out the issues it covers.

---

## §1 Global chrome (sidebar, header, theme)

- [ ] Sidebar renders on every page at desktop width (≥1024px)
- [ ] Sidebar collapse toggle works; collapsed state persists after refresh
- [ ] Mobile hamburger opens sidebar sheet at <768px
- [ ] Header avatar dropdown shows: Profile, Sign out
- [ ] Sign out clears session and redirects anon-protected pages to `/auth`
- [ ] `#81` Theme toggle in sidebar flips light ↔ dark; choice persists on refresh
- [ ] Theme respects `prefers-color-scheme` before any user choice
- [ ] No console errors on initial load of `/`

Playwright: `test.describe("§1 chrome", ...)` in `e2e/qa-checklist.spec.ts`.
One `test(...)` per checkbox above. The `theme toggle` test already exists
as a working reference — model the rest on it.

## §2 Home page (`/`)

- [ ] Hero renders, single `<h1>` visible
- [ ] "Talk to the BBQS Agent" pill links to `https://agent.brain-bbqs.org` in a new tab
- [ ] All 6 navigation cards render: Community, Assistants, Tools & Tutorials,
      Knowledge Base, Legal & Policy, Engineering
- [ ] Every chip inside every card is clickable and lands on a real page (no 404)
- [ ] External chips (e.g. RFA-NS-25-016) open in a new tab
- [ ] Engineering card does **not** show "Suggest a Feature" (removed)
- [ ] Engineering card shows "Roadmap" only

Playwright: `§2 home`. The first three tests are filled in as a reference
pattern; convert the remaining `test.todo` items.

## §3 Navigation — sidebar links

Click each item; verify it lands on the URL shown and that the page renders a
visible `<h1>`. Auth-required items should redirect anon to `/auth`.

- [ ] Home → `/`
- [ ] About → `/about`
- [ ] My Profile (auth) → `/profile`
- [ ] People → `/investigators`
- [ ] Working Groups → `/working-groups`
- [ ] Announcements → `/announcements`
- [ ] Job Board → `/jobs`
- [ ] Calendar (auth) → `/calendar`
- [ ] Resources → `/resources`
- [ ] Projects → `/projects`
- [ ] Grants → `/grants`
- [ ] Species → `/species`
- [ ] Publications → `/publications`
- [ ] Data Provenance — disabled, **not clickable**
- [ ] MIT Workshop 2026 → `/mit-workshop-2026`
- [ ] MIT Workshop Travel (auth) → `/mit-workshop-2026/travel`
- [ ] SFN 2025 → `/sfn-2025`
- [ ] Roadmap (auth) → `/roadmap`
- [ ] Give Feedback → `/suggest-feature`
- [ ] Admin Console (admin only) → `/admin`; hidden for members
- [ ] Data Sharing Policy → `/data-sharing-policy`

Playwright: `§3 nav`. Drive this as a `for (const route of ROUTES) { test(...) }`
loop — see the skeleton's `ANON_ROUTES` / `AUTH_GATED_ROUTES` arrays.

## §4 People / Investigators (`/investigators`)

- [ ] AG Grid renders at least 1 row on desktop
- [ ] Mobile viewport falls back to `MobileCardList`
- [ ] Click any investigator name → `EntitySummaryModal` opens with
      `data-testid="entity-summary-panel"`
- [ ] Escape key closes the modal
- [ ] Click outside the modal closes it
- [ ] Deep link `/investigators?q=<name>` auto-opens that investigator's modal
- [ ] Deep link with no match → grid renders, no auto-open, no crash
- [ ] Every sortable column header sorts ascending then descending
- [ ] Search/filter input filters rows live

Playwright: `§4 investigators`.

## §5 Projects (`/projects`)

- [ ] Grid renders ≥ 1 row
- [ ] All rows load without pagination (continuous scroll)
- [ ] Click row → ProjectProfile or EntitySummaryModal opens
- [ ] As member with linked grant: edit affordance is visible
- [ ] As member without linked grant: edit affordance is hidden
- [ ] Add Project by Grant: lookup pre-fills the form
- [ ] Curation undo restores the previous value

Playwright: `§5 projects`.

## §6 Publications (`/publications`)

- [ ] Grid renders ≥ 1 row, continuous scroll
- [ ] Anon does **not** see "Add Publication" button
- [ ] Member sees "Add Publication" → opens dialog with
      `data-testid="add-publication-dialog"`
- [ ] Submitting empty form shows validation errors
- [ ] Submitting a valid record produces a success toast and a row in
      `pending_writes`
- [ ] DOI / PubMed chip opens external link in a new tab
- [ ] All column headers sort

Playwright: `§6 publications`.

## §7 Resources (`/resources`)

- [ ] Grid renders ≥ 1 row, continuous scroll
- [ ] Category chips (Software, Datasets, Models, Protocols, Benchmarks) filter
- [ ] Anon does **not** see "Add Resource" button
- [ ] Curator sees "Add Resource" → opens dialog
- [ ] External URL chip opens new tab with `rel="noopener"`
- [ ] All column headers sort

Playwright: `§7 resources`.

## §8 Species (`/species`)

- [ ] Grid renders ≥ 1 row
- [ ] UI count matches DB count (covered by `species-count-consistency.spec.ts`)
- [ ] Species chip → EntitySummaryModal
- [ ] Sortable columns work

Playwright: `§8 species`.

## §9 Grants / Funding Opportunities (`/grants`)

- [ ] Grid renders ≥ 1 row
- [ ] Click row opens `FundingDetailPanel`
- [ ] Anon does **not** see "Add Funding Opportunity"
- [ ] Member/admin sees "Add Funding Opportunity" → dialog opens, submits to
      `pending_writes`
- [ ] External NIH link opens in new tab

Playwright: `§9 grants`.

## §10 Job Board (`/jobs`)

- [ ] Card list renders ≥ 1 posting
- [ ] Anon does **not** see "Add Opportunity"
- [ ] Member sees "Add Opportunity" → dialog opens
- [ ] External "Apply" button opens in new tab
- [ ] Expired postings are filtered out

Playwright: `§10 jobs`.

## §11 Announcements (`/announcements`)

- [ ] List renders
- [ ] Card click opens detail
- [ ] Drafts are invisible to anon

Playwright: `§11 announcements`.

## §12 Working Groups (`/working-groups`)

- [ ] Cards render for each working group
- [ ] Each chair chip opens InvestigatorSummary modal
- [ ] External meeting links open in new tab

Playwright: `§12 working-groups`.

## §13 Calendar (`/calendar`) — auth required

- [x] Anon hitting `/calendar` is redirected to `/auth`
- [ ] Member sees events on month/week views
- [ ] Event click opens detail

Playwright: `§13 calendar` (anon-redirect only).

## §14 Roadmap (`/roadmap`) — auth required

- [x] Anon hitting `/roadmap` is redirected to `/auth`
- [ ] Authed user sees milestones from `github-roadmap` edge function
- [ ] Each milestone card links to its GitHub issue in a new tab

Playwright: `§14 roadmap` (anon-redirect only).

## §15 MIT Workshop 2026 (`/mit-workshop-2026` + `/travel`)

- [ ] Landing page renders agenda, speakers, register CTA
- [ ] Register CTA opens correct form / new tab
- [x] Travel page is auth-gated (anon → `/auth`)
- [ ] Hotel map (`HotelLocationMap`) renders all hotel pins
- [ ] Date warnings (see memory: `mit-workshop-travel`) render correctly

Playwright: `§15 mit-workshop`.

## §16 SFN 2025 (`/sfn-2025`)

- [ ] Page renders agenda + speaker list
- [ ] All speaker chips open `InvestigatorSummary`

Playwright: `§16 sfn`.

## §17 Profile (`/profile`) — auth required

- [x] Anon → `/auth`
- [ ] Member sees own profile only
- [ ] Linked-email member can edit their own grants; not others
- [ ] Onboarding modal shows for first-time user; dismiss persists in localStorage

Playwright: `§17 profile` (anon-redirect only).

## §18 Admin Console (`/admin`) — admin only

- [x] Anon → `/auth`
- [ ] Member → redirected away / 403
- [ ] Admin sees: Access Requests tab, Users tab, System Alerts banner
- [ ] Approving an access request mutates `user_roles`

Playwright: `§18 admin` (anon-redirect only).

## §19 Give Feedback (`/suggest-feature`)

- [ ] Form renders
- [ ] Submitting empty form shows validation errors
- [ ] Valid submission shows success toast
- [ ] `#82` Auto-feedback submission posts under the bot account, not the user

Playwright: `§19 feedback`.

## §20 Auth (`/auth`, `/auth/callback`)

- [ ] `/auth` shows the Globus button and nothing else
- [ ] Globus button opens Globus consent (do not complete in prod)
- [ ] `/auth/callback?error=...` renders an error state, no crash
- [ ] `/auth/callback` with valid code redirects home and creates a session

Playwright: `§20 auth`.

## §21 404 / catch-all

- [ ] `/this-does-not-exist` renders the NotFound page
- [ ] NotFound has a single `<h1>` and a "Back to home" link

Playwright: `§21 not-found`.

## §22 Cross-cutting checks

- [ ] No JS console errors on any public route (see `console-errors.spec.ts`)
- [ ] No broken same-origin images on any route
- [ ] Every public route has a `<title>` <60 chars and `<meta description>` <160
- [ ] Single `<h1>` per route
- [ ] All external `<a>` tags use `rel="noopener noreferrer"`
- [ ] Sign-out from any page returns you to a public state

Playwright: `§22 cross-cutting`. Drive these from a route loop — assert
`<title>` length, single `<h1>`, and `rel="noopener"` on every external
`<a>` for every route in `ANON_ROUTES`.

---

## §99 Bug report template

When you find a defect, open a GitHub issue with:

```
Title:    [QA] <section> — <one-line summary>
Labels:   bug, qa

Environment:  staging | local | prod
Route:        /<path>
Repro steps:
  1.
  2.
  3.
Expected:
Actual:
Screenshot / video:
Console / network errors:
```

Link the issue back into this file as `[x] (bug #<n>)` so we can track coverage.

## Done definition

- Every checkbox above is `[x]` or annotated with a linked bug.
- Every `test.todo` in `e2e/qa-checklist.spec.ts` is either implemented or
  replaced with a `test.fail(...)` that references a tracked bug.
- `npx playwright test e2e/qa-checklist.spec.ts` passes on chromium **and** mobile.
- `docs/QA_PLAN.md` §2 is updated to flip the corresponding 🔴 → ✅ rows.
