# BBQS QA Checklist — v1.0.0

Hands-on QA walkthrough for the BBQS app. Work through it top-to-bottom,
ticking each `[ ]` checkbox as you go. Every item has a matching automated
Playwright test in `e2e/qa-checklist.spec.ts` so you can cross-check your
manual result against CI.

## How to work this document

1. **Open two windows:** the BBQS preview (or `https://brain-bbq-clone.lovable.app`)
   and this file in your editor.
2. For each section, perform the click/interaction described, then tick the box.
3. If something is broken, **do not edit the test** — file a GitHub issue using the
   template in §99 and link it from the checkbox like `[x] (bug #149)`.
4. When the whole section is green, run the matching Playwright test:
   ```bash
   npx playwright test e2e/qa-checklist.spec.ts -g "§<section-number>"
   ```
5. When the entire document is green, run the whole suite:
   ```bash
   npx playwright test e2e/qa-checklist.spec.ts
   ```

## Environments

| Env | URL | Auth |
|---|---|---|
| Local preview | `http://localhost:8080` | preview-mode bypass, you are signed in as `Preview User` |
| Staging | `https://staging.brain-bbqs.org` | `staging-fake-login` edge function (admin/member fixtures) |
| Prod | `https://brain-bbqs.org` | Globus OAuth — **DO NOT submit test data here** |

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

Test: `§1 chrome`

## §2 Home page (`/`)

- [ ] Hero renders, single `<h1>` visible
- [ ] "Talk to the BBQS Agent" pill links to `https://agent.brain-bbqs.org` in a new tab
- [ ] All 6 navigation cards render: Community, Assistants, Tools & Tutorials,
      Knowledge Base, Legal & Policy, Engineering
- [ ] Every chip inside every card is clickable and lands on a real page (no 404)
- [ ] External chips (e.g. RFA-NS-25-016) open in a new tab
- [ ] Engineering card does **not** show "Suggest a Feature" (removed)
- [ ] Engineering card shows "Roadmap" only

Test: `§2 home`

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

Test: `§3 nav`

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

Test: `§4 investigators`

## §5 Projects (`/projects`)

- [ ] Grid renders ≥ 1 row
- [ ] All rows load without pagination (continuous scroll)
- [ ] Click row → ProjectProfile or EntitySummaryModal opens
- [ ] As member with linked grant: edit affordance is visible
- [ ] As member without linked grant: edit affordance is hidden
- [ ] Add Project by Grant: lookup pre-fills the form
- [ ] Curation undo restores the previous value

Test: `§5 projects`

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

Test: `§6 publications`

## §7 Resources (`/resources`)

- [ ] Grid renders ≥ 1 row, continuous scroll
- [ ] Category chips (Software, Datasets, Models, Protocols, Benchmarks) filter
- [ ] Anon does **not** see "Add Resource" button
- [ ] Curator sees "Add Resource" → opens dialog
- [ ] External URL chip opens new tab with `rel="noopener"`
- [ ] All column headers sort

Test: `§7 resources`

## §8 Species (`/species`)

- [ ] Grid renders ≥ 1 row
- [ ] UI count matches DB count (covered by `species-count-consistency.spec.ts`)
- [ ] Species chip → EntitySummaryModal
- [ ] Sortable columns work

Test: `§8 species`

## §9 Grants / Funding Opportunities (`/grants`)

- [ ] Grid renders ≥ 1 row
- [ ] Click row opens `FundingDetailPanel`
- [ ] Anon does **not** see "Add Funding Opportunity"
- [ ] Member/admin sees "Add Funding Opportunity" → dialog opens, submits to
      `pending_writes`
- [ ] External NIH link opens in new tab

Test: `§9 grants`

## §10 Job Board (`/jobs`)

- [ ] Card list renders ≥ 1 posting
- [ ] Anon does **not** see "Add Opportunity"
- [ ] Member sees "Add Opportunity" → dialog opens
- [ ] External "Apply" button opens in new tab
- [ ] Expired postings are filtered out

Test: `§10 jobs`

## §11 Announcements (`/announcements`)

- [ ] List renders
- [ ] Card click opens detail
- [ ] Drafts are invisible to anon

Test: `§11 announcements`

## §12 Working Groups (`/working-groups`)

- [ ] Cards render for each working group
- [ ] Each chair chip opens InvestigatorSummary modal
- [ ] External meeting links open in new tab

Test: `§12 working-groups`

## §13 Calendar (`/calendar`) — auth required

- [ ] Anon hitting `/calendar` is redirected to `/auth`
- [ ] Member sees events on month/week views
- [ ] Event click opens detail

Test: `§13 calendar`

## §14 Roadmap (`/roadmap`) — auth required

- [ ] Anon hitting `/roadmap` is redirected to `/auth`
- [ ] Authed user sees milestones from `github-roadmap` edge function
- [ ] Each milestone card links to its GitHub issue in a new tab

Test: `§14 roadmap`

## §15 MIT Workshop 2026 (`/mit-workshop-2026` + `/travel`)

- [ ] Landing page renders agenda, speakers, register CTA
- [ ] Register CTA opens correct form / new tab
- [ ] Travel page is auth-gated (anon → `/auth`)
- [ ] Hotel map (`HotelLocationMap`) renders all hotel pins
- [ ] Date warnings (see memory: `mit-workshop-travel`) render correctly

Test: `§15 mit-workshop`

## §16 SFN 2025 (`/sfn-2025`)

- [ ] Page renders agenda + speaker list
- [ ] All speaker chips open `InvestigatorSummary`

Test: `§16 sfn`

## §17 Profile (`/profile`) — auth required

- [ ] Anon → `/auth`
- [ ] Member sees own profile only
- [ ] Linked-email member can edit their own grants; not others
- [ ] Onboarding modal shows for first-time user; dismiss persists in localStorage

Test: `§17 profile`

## §18 Admin Console (`/admin`) — admin only

- [ ] Anon → `/auth`
- [ ] Member → redirected away / 403
- [ ] Admin sees: Access Requests tab, Users tab, System Alerts banner
- [ ] Approving an access request mutates `user_roles`

Test: `§18 admin`

## §19 Give Feedback (`/suggest-feature`)

- [ ] Form renders
- [ ] Submitting empty form shows validation errors
- [ ] Valid submission shows success toast
- [ ] `#82` Auto-feedback submission posts under the bot account, not the user

Test: `§19 feedback`

## §20 Auth (`/auth`, `/auth/callback`)

- [ ] `/auth` shows the Globus button and nothing else
- [ ] Globus button opens Globus consent (do not complete in prod)
- [ ] `/auth/callback?error=...` renders an error state, no crash
- [ ] `/auth/callback` with valid code redirects home and creates a session

Test: `§20 auth`

## §21 404 / catch-all

- [ ] `/this-does-not-exist` renders the NotFound page
- [ ] NotFound has a single `<h1>` and a "Back to home" link

Test: `§21 not-found`

## §22 Cross-cutting checks

- [ ] No JS console errors on any public route (see `console-errors.spec.ts`)
- [ ] No broken same-origin images on any route
- [ ] Every public route has a `<title>` <60 chars and `<meta description>` <160
- [ ] Single `<h1>` per route
- [ ] All external `<a>` tags use `rel="noopener noreferrer"`
- [ ] Sign-out from any page returns you to a public state

Test: `§22 cross-cutting`

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
- `npx playwright test e2e/qa-checklist.spec.ts` passes on chromium **and** mobile.
- `docs/QA_PLAN.md` §2 is updated to flip the corresponding 🔴 → ✅ rows.