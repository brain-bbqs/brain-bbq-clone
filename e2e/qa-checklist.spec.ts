import { test, expect, Page } from "@playwright/test";

/**
 * Standard QA suite — skeleton.
 *
 * This file is the executable mirror of `docs/QA_CHECKLIST.md`. Every
 * checklist section (§1 … §22) has a matching `test.describe` block below.
 * Most checkboxes ship as `test.todo("...")` placeholders — fill them in
 * as you QA each section. See the checklist's "How to add a Playwright
 * test for a checkbox" section for the workflow.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * RUNNING
 * ──────────────────────────────────────────────────────────────────────────
 *   Whole suite:        npx playwright test e2e/qa-checklist.spec.ts
 *   Single section:     npx playwright test e2e/qa-checklist.spec.ts -g "§4"
 *   Headed debugging:   npx playwright test e2e/qa-checklist.spec.ts --headed --debug
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW TO FILL IN A `test.todo`
 * ──────────────────────────────────────────────────────────────────────────
 *   1. Find the `test.todo("§N <thing>")` matching the checkbox you just
 *      verified manually.
 *   2. Replace it with a real test:
 *
 *        test("§4 grid renders at least one row", async ({ page }) => {
 *          await gotoOk(page, "/investigators");
 *          await expect(page.locator(".ag-row").first()).toBeVisible();
 *        });
 *
 *   3. Keep one checkbox = one `test()`. Don't bundle.
 *   4. Prefer role/text locators over CSS. Reach for `data-testid` only
 *      when role/text isn't unique, and add the testid on the component
 *      rather than inventing it in the test.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HELPERS
 * ──────────────────────────────────────────────────────────────────────────
 *   gotoOk(page, path)        navigate + wait for networkidle + fail on
 *                             console errors
 *   expectAnonRedirect(page,  assert anon hitting an auth-gated route
 *     path)                   lands on /auth
 *   expectExternal(locator,   assert <a> has target=_blank +
 *     hrefPattern)            rel="noopener" and href matches
 *
 * ──────────────────────────────────────────────────────────────────────────
 * CONVENTIONS
 * ──────────────────────────────────────────────────────────────────────────
 *   - Anon-only. Member/admin coverage lives in fixture suites.
 *   - For auth-gated routes, only assert the /auth redirect.
 *   - If a check is blocked on missing infra, leave the `test.todo` in
 *     place and add a `// needs: <thing>` comment.
 *   - If a bug blocks an assertion, replace the todo with `test.fail(...)`
 *     and a `// bug #<n>` comment so CI tracks the regression.
 */

// ─── Route inventory ─────────────────────────────────────────────────────────
export const ANON_ROUTES = [
  "/", "/about", "/investigators", "/projects", "/publications",
  "/resources", "/species", "/working-groups", "/announcements",
  "/jobs", "/grants", "/suggest-feature", "/tutorials",
  "/data-sharing-policy", "/state-privacy", "/mcp-docs", "/mcp-tutorial",
  "/sfn-2025", "/mit-workshop-2026",
] as const;

export const AUTH_GATED_ROUTES = [
  "/profile", "/calendar", "/roadmap", "/mit-workshop-2026/travel", "/admin",
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export async function gotoOk(page: Page, path: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(path, { waitUntil: "networkidle", timeout: 30_000 });
  expect(errors, `console errors on ${path}:\n${errors.join("\n")}`).toEqual([]);
}

export async function expectAnonRedirect(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle", timeout: 30_000 });
  await expect(page).toHaveURL(/\/auth(\?|$)/);
}

export async function expectExternal(
  locator: ReturnType<Page["locator"]>,
  hrefPattern: RegExp,
) {
  await expect(locator).toHaveAttribute("href", hrefPattern);
  await expect(locator).toHaveAttribute("target", "_blank");
  await expect(locator).toHaveAttribute("rel", /noopener/);
}

// ═════════════════════════════════════════════════════════════════════════════
// §1 Global chrome (sidebar, header, theme)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§1 chrome", () => {
  test("sidebar renders on desktop home", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoOk(page, "/");
    await expect(page.locator("[data-sidebar]").first()).toBeVisible();
  });

  test.todo("§1 sidebar collapse toggle persists after refresh");
  test.todo("§1 mobile hamburger opens sidebar sheet <768px");
  test.todo("§1 header avatar dropdown shows Profile + Sign out");
  test.todo("§1 sign out redirects anon-protected pages to /auth");
  test.todo("§1 #81 theme toggle flips light↔dark and persists");
  test.todo("§1 respects prefers-color-scheme before any user choice");
});

// ═════════════════════════════════════════════════════════════════════════════
// §2 Home page (`/`) — reference patterns filled in
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§2 home", () => {
  test("hero + single h1 + agent CTA", async ({ page }) => {
    await gotoOk(page, "/");
    expect(await page.locator("h1").count()).toBeGreaterThanOrEqual(1);
    const agent = page.getByRole("link", { name: /talk to the bbqs agent/i });
    await expectExternal(agent, /agent\.brain-bbqs\.org/);
  });

  test("all 6 nav cards render", async ({ page }) => {
    await gotoOk(page, "/");
    for (const title of [
      "Community", "Assistants", "Tools & Tutorials",
      "Knowledge Base", "Legal & Policy", "Engineering",
    ]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
  });

  test("engineering card hides Suggest a Feature, keeps Roadmap", async ({ page }) => {
    await gotoOk(page, "/");
    const engHeading = page.getByRole("heading", { name: "Engineering" });
    const engCard = engHeading.locator("xpath=ancestor::*[contains(@class,'rounded-2xl')][1]");
    await expect(engCard.getByRole("link", { name: /roadmap/i })).toBeVisible();
    expect(await engCard.getByText(/suggest a feature/i).count()).toBe(0);
  });

  test.todo("§2 every chip in every card lands on a real page (no 404)");
  test.todo("§2 external chips (e.g. RFA-NS-25-016) open in a new tab");
});

// ═════════════════════════════════════════════════════════════════════════════
// §3 Navigation — sidebar links
// Drive both arrays as parameterized tests.
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§3 nav", () => {
  for (const path of ANON_ROUTES) {
    test.todo(`§3 anon route renders with <h1>: ${path}`);
  }
  for (const path of AUTH_GATED_ROUTES) {
    test(`§3 anon redirected from auth-gated ${path}`, async ({ page }) => {
      await expectAnonRedirect(page, path);
    });
  }
  test.todo("§3 Data Provenance sidebar item is disabled / not clickable");
  test.todo("§3 Admin Console hidden from non-admins");
});

// ═════════════════════════════════════════════════════════════════════════════
// §4 People / Investigators (`/investigators`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§4 investigators", () => {
  test.todo("§4 AG Grid renders ≥1 row on desktop");
  test.todo("§4 mobile viewport falls back to MobileCardList");
  test.todo("§4 clicking name opens EntitySummaryModal");
  test.todo("§4 Escape closes the modal");
  test.todo("§4 click-outside closes the modal");
  test.todo("§4 deep link ?q=<name> auto-opens that investigator");
  test.todo("§4 deep link with no match renders grid, no crash");
  test.todo("§4 every sortable column header sorts asc/desc");
  test.todo("§4 search input filters rows live");
});

// ═════════════════════════════════════════════════════════════════════════════
// §5 Projects (`/projects`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§5 projects", () => {
  test.todo("§5 grid renders ≥1 row");
  test.todo("§5 continuous scroll, no pagination");
  test.todo("§5 row click opens ProjectProfile / EntitySummaryModal");
  test.todo("§5 member with linked grant: edit affordance visible (fixture)");
  test.todo("§5 member without linked grant: edit affordance hidden (fixture)");
  test.todo("§5 Add Project by Grant pre-fills the form");
  test.todo("§5 curation undo restores previous value");
});

// ═════════════════════════════════════════════════════════════════════════════
// §6 Publications (`/publications`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§6 publications", () => {
  test.todo("§6 grid renders ≥1 row, continuous scroll");
  test.todo("§6 anon does NOT see Add Publication");
  test.todo("§6 member sees Add Publication → dialog opens (fixture)");
  test.todo("§6 empty form shows validation errors");
  test.todo("§6 valid submit toasts + writes to pending_writes");
  test.todo("§6 DOI/PubMed chip opens external link in new tab");
  test.todo("§6 all column headers sort");
});

// ═════════════════════════════════════════════════════════════════════════════
// §7 Resources (`/resources`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§7 resources", () => {
  test.todo("§7 grid renders ≥1 row, continuous scroll");
  test.todo("§7 category chips filter the grid");
  test.todo("§7 anon does NOT see Add Resource");
  test.todo("§7 curator sees Add Resource → dialog opens (fixture)");
  test.todo("§7 external URL chip opens new tab with rel=noopener");
  test.todo("§7 all column headers sort");
});

// ═════════════════════════════════════════════════════════════════════════════
// §8 Species (`/species`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§8 species", () => {
  test.todo("§8 grid renders ≥1 row");
  test.todo("§8 species chip opens EntitySummaryModal");
  test.todo("§8 sortable columns work");
  // UI/DB count parity already covered by species-count-consistency.spec.ts
});

// ═════════════════════════════════════════════════════════════════════════════
// §9 Grants / Funding Opportunities (`/grants`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§9 grants", () => {
  test.todo("§9 grid renders ≥1 row");
  test.todo("§9 row click opens FundingDetailPanel");
  test.todo("§9 anon does NOT see Add Funding Opportunity");
  test.todo("§9 member/admin sees Add Funding Opportunity → submits (fixture)");
  test.todo("§9 external NIH link opens in new tab");
});

// ═════════════════════════════════════════════════════════════════════════════
// §10 Job Board (`/jobs`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§10 jobs", () => {
  test.todo("§10 card list renders ≥1 posting");
  test.todo("§10 anon does NOT see Add Opportunity");
  test.todo("§10 member sees Add Opportunity → dialog opens (fixture)");
  test.todo("§10 external Apply opens in new tab");
  test.todo("§10 expired postings are filtered out");
});

// ═════════════════════════════════════════════════════════════════════════════
// §11 Announcements (`/announcements`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§11 announcements", () => {
  test.todo("§11 list renders");
  test.todo("§11 card click opens detail");
  test.todo("§11 drafts invisible to anon");
});

// ═════════════════════════════════════════════════════════════════════════════
// §12 Working Groups (`/working-groups`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§12 working-groups", () => {
  test.todo("§12 cards render for each working group");
  test.todo("§12 chair chip opens InvestigatorSummary modal");
  test.todo("§12 external meeting links open in new tab");
});

// ═════════════════════════════════════════════════════════════════════════════
// §13 Calendar (`/calendar`) — auth required
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§13 calendar", () => {
  test("§13 anon redirected to /auth", async ({ page }) => {
    await expectAnonRedirect(page, "/calendar");
  });
  // member coverage → fixture suite
});

// ═════════════════════════════════════════════════════════════════════════════
// §14 Roadmap (`/roadmap`) — auth required
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§14 roadmap", () => {
  test("§14 anon redirected to /auth", async ({ page }) => {
    await expectAnonRedirect(page, "/roadmap");
  });
  // authed milestone rendering → fixture suite
});

// ═════════════════════════════════════════════════════════════════════════════
// §15 MIT Workshop 2026
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§15 mit-workshop", () => {
  test.todo("§15 landing renders agenda, speakers, register CTA");
  test.todo("§15 register CTA opens correct form / new tab");
  test("§15 /travel is auth-gated", async ({ page }) => {
    await expectAnonRedirect(page, "/mit-workshop-2026/travel");
  });
  test.todo("§15 HotelLocationMap renders all hotel pins (fixture)");
  test.todo("§15 travel date warnings render correctly (fixture)");
});

// ═════════════════════════════════════════════════════════════════════════════
// §16 SFN 2025 (`/sfn-2025`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§16 sfn", () => {
  test.todo("§16 page renders agenda + speaker list");
  test.todo("§16 every speaker chip opens InvestigatorSummary");
});

// ═════════════════════════════════════════════════════════════════════════════
// §17 Profile (`/profile`) — auth required
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§17 profile", () => {
  test("§17 anon redirected to /auth", async ({ page }) => {
    await expectAnonRedirect(page, "/profile");
  });
  // linked-email edit rights + onboarding modal → fixture suite
});

// ═════════════════════════════════════════════════════════════════════════════
// §18 Admin Console (`/admin`) — admin only
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§18 admin", () => {
  test("§18 anon redirected to /auth", async ({ page }) => {
    await expectAnonRedirect(page, "/admin");
  });
  // member-403 + admin tabs + approve mutation → fixture suite
});

// ═════════════════════════════════════════════════════════════════════════════
// §19 Give Feedback (`/suggest-feature`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§19 feedback", () => {
  test.todo("§19 form renders");
  test.todo("§19 empty submit shows validation errors");
  test.todo("§19 valid submit shows success toast");
  test.todo("§19 #82 auto-feedback posts under bot account, not user");
});

// ═════════════════════════════════════════════════════════════════════════════
// §20 Auth (`/auth`, `/auth/callback`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§20 auth", () => {
  test.todo("§20 /auth shows Globus button and nothing else");
  test.todo("§20 Globus button opens consent (do not complete in prod)");
  test.todo("§20 /auth/callback?error=... renders error state, no crash");
  test.todo("§20 /auth/callback with valid code redirects home + session");
});

// ═════════════════════════════════════════════════════════════════════════════
// §21 404 / catch-all
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§21 not-found", () => {
  test.todo("§21 /this-does-not-exist renders NotFound");
  test.todo("§21 NotFound has a single <h1> and a Back-to-home link");
});

// ═════════════════════════════════════════════════════════════════════════════
// §22 Cross-cutting checks — drive from ANON_ROUTES
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§22 cross-cutting", () => {
  for (const path of ANON_ROUTES) {
    test.todo(`§22 ${path} — single <h1>, title <60, meta-description <160`);
    test.todo(`§22 ${path} — every external <a> has rel="noopener noreferrer"`);
    test.todo(`§22 ${path} — no broken same-origin images`);
  }
  test.todo("§22 sign-out from any page returns to public state");
});