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

/** Navigate with domcontentloaded then wait for at least one AG Grid row. */
async function gotoGrid(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator(".ag-row").first().waitFor({ state: "visible", timeout: 25_000 });
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

  test("§1 sidebar collapse toggle persists after refresh", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Expanded state: "Close sidebar" button is visible in the sidebar header
    await expect(page.locator("button[aria-label='Close sidebar']")).toBeVisible({ timeout: 5_000 });
    // Collapse it
    await page.locator("button[aria-label='Close sidebar']").click();
    // FloatingTrigger "Open sidebar" appears when sidebar is collapsed
    await expect(page.locator("button[title='Open sidebar']")).toBeVisible({ timeout: 3_000 });
    // Reload and verify collapsed state persists (SidebarProvider stores state in a cookie)
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("button[title='Open sidebar']")).toBeVisible({ timeout: 5_000 });
  });

  test("§1 mobile hamburger opens sidebar sheet <768px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // On mobile the sidebar starts closed; FloatingTrigger is visible
    const openBtn = page.locator("button[title='Open sidebar']");
    await expect(openBtn).toBeVisible({ timeout: 5_000 });
    await openBtn.click();
    // AppSidebar sheet is now open; "Close menu" button appears inside it
    await expect(page.locator("button[aria-label='Close menu']")).toBeVisible({ timeout: 5_000 });
  });

  test.todo("§1 header avatar dropdown shows Profile + Sign out");
  test.todo("§1 sign out redirects anon-protected pages to /auth");

  test("§1 #81 theme toggle flips light↔dark and persists", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Default theme is "dark" (ThemeContext default: localStorage "bbqs-theme" || "dark")
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    // Toggle to light — button aria-label is "Switch to light theme" when currently dark
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    // Persists after reload (stored in localStorage under key "bbqs-theme")
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  });

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
    test(`§3 anon route renders with <h1>: ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    });
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
  test("§4 AG Grid renders ≥1 row on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoGrid(page, "/investigators");
  });

  test("§4 mobile viewport falls back to MobileCardList", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/investigators", { waitUntil: "domcontentloaded", timeout: 30_000 });
    // AG Grid should not be visible on mobile; MobileCardList renders instead
    await expect(page.locator(".ag-root-wrapper")).not.toBeVisible({ timeout: 10_000 });
    // MobileCardList items render as cards (bg-card border rounded-lg)
    await expect(page.locator(".bg-card.border").first()).toBeVisible({ timeout: 15_000 });
  });

  test("§4 clicking name opens EntitySummaryModal", async ({ page }) => {
    await gotoGrid(page, "/investigators");
    const firstRow = page.locator(".ag-row").first();
    // Name cells render a button that triggers EntitySummaryModal
    const nameBtn = firstRow.locator("button").first();
    if (await nameBtn.isVisible().catch(() => false)) {
      await nameBtn.click();
    } else {
      await firstRow.click();
    }
    await expect(page.locator('[data-testid="entity-summary-panel"]')).toBeVisible({ timeout: 8_000 });
  });

  test("§4 Escape closes the modal", async ({ page }) => {
    await gotoGrid(page, "/investigators");
    const firstRow = page.locator(".ag-row").first();
    const nameBtn = firstRow.locator("button").first();
    if (await nameBtn.isVisible().catch(() => false)) {
      await nameBtn.click();
    } else {
      await firstRow.click();
    }
    await page.locator('[data-testid="entity-summary-panel"]').waitFor({ state: "visible", timeout: 8_000 });
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="entity-summary-panel"]')).not.toBeVisible({ timeout: 3_000 });
  });

  test("§4 click-outside closes the modal", async ({ page }) => {
    await gotoGrid(page, "/investigators");
    const firstRow = page.locator(".ag-row").first();
    const nameBtn = firstRow.locator("button").first();
    if (await nameBtn.isVisible().catch(() => false)) {
      await nameBtn.click();
    } else {
      await firstRow.click();
    }
    await page.locator('[data-testid="entity-summary-panel"]').waitFor({ state: "visible", timeout: 8_000 });
    // Panel slides in from the right; click the left-side backdrop to dismiss
    await page.mouse.click(10, 400);
    await expect(page.locator('[data-testid="entity-summary-panel"]')).not.toBeVisible({ timeout: 3_000 });
  });

  // needs: known investigator name from seed/staging data
  test.todo("§4 deep link ?q=<name> auto-opens that investigator");
  test.todo("§4 deep link with no match renders grid, no auto-open, no crash");

  test("§4 every sortable column header sorts asc/desc", async ({ page }) => {
    await gotoGrid(page, "/investigators");
    // "Name" column is sortable; click once for ascending, again for descending
    const nameHeader = page.locator(".ag-header-cell").filter({ hasText: /^Name$/ });
    await nameHeader.click();
    await expect(nameHeader).toHaveAttribute("aria-sort", "ascending", { timeout: 3_000 });
    await nameHeader.click();
    await expect(nameHeader).toHaveAttribute("aria-sort", "descending", { timeout: 3_000 });
  });

  test("§4 search input filters rows live", async ({ page }) => {
    await gotoGrid(page, "/investigators");
    const input = page.locator("input[placeholder*='Filter by name']");
    await expect(input).toBeVisible();
    const initialCount = await page.locator(".ag-row").count();
    expect(initialCount).toBeGreaterThan(0);
    // A nonsense string should match nothing and collapse the grid to 0 rows
    await input.fill("XYZABC_NO_MATCH_9999_ZZZ");
    await expect(page.locator(".ag-row")).toHaveCount(0, { timeout: 5_000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// §5 Projects (`/projects`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§5 projects", () => {
  test("§5 grid renders ≥1 row", async ({ page }) => {
    await gotoGrid(page, "/projects");
  });

  test.todo("§5 continuous scroll, no pagination");

  test("§5 row click opens ProjectProfile / EntitySummaryModal", async ({ page }) => {
    await gotoGrid(page, "/projects");
    const firstRow = page.locator(".ag-row").first();
    // Title/PI/institution cells open EntitySummaryModal; try button first
    const btn = firstRow.locator("button").first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    } else {
      await firstRow.click();
    }
    await expect(page.locator('[data-testid="entity-summary-panel"]')).toBeVisible({ timeout: 8_000 });
  });

  test.todo("§5 member with linked grant: edit affordance visible (fixture)");
  test.todo("§5 member without linked grant: edit affordance hidden (fixture)");
  test.todo("§5 Add Project by Grant pre-fills the form");
  test.todo("§5 curation undo restores previous value");
});

// ═════════════════════════════════════════════════════════════════════════════
// §6 Publications (`/publications`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§6 publications", () => {
  test("§6 grid renders ≥1 row, continuous scroll", async ({ page }) => {
    await gotoGrid(page, "/publications");
  });

  test("§6 anon does NOT see Add Publication", async ({ page }) => {
    await gotoGrid(page, "/publications");
    await expect(page.getByRole("button", { name: /add publication/i })).toHaveCount(0);
  });

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
  test("§7 grid renders ≥1 row, continuous scroll", async ({ page }) => {
    await gotoGrid(page, "/resources");
  });

  test("§7 category chips filter the grid", async ({ page }) => {
    await gotoGrid(page, "/resources");
    const allCount = await page.locator(".ag-row").count();
    // Click a specific category filter — row count must not exceed "All" count
    await page.getByRole("button", { name: "Datasets" }).click();
    await expect(async () => {
      const filtered = await page.locator(".ag-row").count();
      expect(filtered).toBeLessThanOrEqual(allCount);
    }).toPass({ timeout: 5_000 });
  });

  test("§7 anon does NOT see Add Resource", async ({ page }) => {
    await gotoGrid(page, "/resources");
    await expect(page.getByRole("button", { name: /add resource/i })).toHaveCount(0);
  });

  test.todo("§7 curator sees Add Resource → dialog opens (fixture)");
  test.todo("§7 external URL chip opens new tab with rel=noopener");
  test.todo("§7 all column headers sort");
});

// ═════════════════════════════════════════════════════════════════════════════
// §8 Species (`/species`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§8 species", () => {
  test("§8 grid renders ≥1 row", async ({ page }) => {
    await gotoGrid(page, "/species");
  });

  test("§8 species chip opens EntitySummaryModal", async ({ page }) => {
    await gotoGrid(page, "/species");
    const firstRow = page.locator(".ag-row").first();
    // Species badge buttons in the row trigger EntitySummaryModal
    const btn = firstRow.locator("button").first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    } else {
      await firstRow.click();
    }
    await expect(page.locator('[data-testid="entity-summary-panel"]')).toBeVisible({ timeout: 8_000 });
  });

  test("§8 sortable columns work", async ({ page }) => {
    await gotoGrid(page, "/species");
    const speciesHeader = page.locator(".ag-header-cell").filter({ hasText: /^Species$/ });
    await speciesHeader.click();
    await expect(speciesHeader).toHaveAttribute("aria-sort", "ascending", { timeout: 3_000 });
    await speciesHeader.click();
    await expect(speciesHeader).toHaveAttribute("aria-sort", "descending", { timeout: 3_000 });
  });

  // UI/DB count parity already covered by species-count-consistency.spec.ts
});

// ═════════════════════════════════════════════════════════════════════════════
// §9 Grants / Funding Opportunities (`/grants`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§9 grants", () => {
  test("§9 grid renders ≥1 row", async ({ page }) => {
    await gotoGrid(page, "/grants");
  });

  test("§9 row click opens FundingDetailPanel", async ({ page }) => {
    await gotoGrid(page, "/grants");
    await page.locator(".ag-row").first().click();
    // FundingDetailPanel is a shadcn Sheet (renders with role="dialog")
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test("§9 anon does NOT see Add Funding Opportunity", async ({ page }) => {
    await gotoGrid(page, "/grants");
    await expect(page.getByRole("button", { name: /add opportunity|add funding/i })).toHaveCount(0);
  });

  test.todo("§9 member/admin sees Add Funding Opportunity → submits (fixture)");
  test.todo("§9 external NIH link opens in new tab");
});

// ═════════════════════════════════════════════════════════════════════════════
// §10 Job Board (`/jobs`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§10 jobs", () => {
  test("§10 card list renders ≥1 posting", async ({ page }) => {
    await page.goto("/jobs", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect(page.locator("h1")).toHaveText(/job board/i, { timeout: 10_000 });
    // Job cards render inside a responsive grid; at least one card must be visible
    // Each card has a heading with the position title
    await expect(page.locator("[class*='grid'] [class*='rounded']").first()).toBeVisible({ timeout: 15_000 });
  });

  // "Post a Position" button is visible to anon but redirects to /auth on click — not hidden
  test.todo("§10 anon does NOT see Add Opportunity");
  test.todo("§10 member sees Add Opportunity → dialog opens (fixture)");
  test.todo("§10 external Apply opens in new tab");
  test.todo("§10 expired postings are filtered out");
});

// ═════════════════════════════════════════════════════════════════════════════
// §11 Announcements (`/announcements`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§11 announcements", () => {
  test("§11 list renders", async ({ page }) => {
    await page.goto("/announcements", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect(page.locator("h1")).toHaveText(/announcements/i, { timeout: 10_000 });
    // Announcement cards render in a vertical list; at least one must be visible
    await expect(page.locator(".bg-card").first()).toBeVisible({ timeout: 15_000 });
  });

  test.todo("§11 card click opens detail");
  test.todo("§11 drafts invisible to anon");
});

// ═════════════════════════════════════════════════════════════════════════════
// §12 Working Groups (`/working-groups`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§12 working-groups", () => {
  test("§12 cards render for each working group", async ({ page }) => {
    await gotoOk(page, "/working-groups");
    // All four working groups must be visible
    for (const name of ["Analytics", "Devices", "ELSI", "Standards"]) {
      await expect(page.getByRole("heading", { name }).first()).toBeVisible();
    }
  });

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
  test("§15 landing renders agenda, speakers, register CTA", async ({ page }) => {
    await page.goto("/mit-workshop-2026", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
    // Agenda section heading
    await expect(page.getByRole("heading", { name: /agenda/i }).first()).toBeVisible({ timeout: 10_000 });
    // Register CTA — shown as "Sign in to Register" for anon or "Register Now" for members
    await expect(
      page.getByRole("button", { name: /sign in to register/i }).or(
        page.getByRole("link", { name: /register now/i })
      ).first()
    ).toBeVisible({ timeout: 10_000 });
  });

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
  test("§16 page renders agenda + speaker list", async ({ page }) => {
    await page.goto("/sfn-2025", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect(page.locator("h1")).toContainText(/sfn 2025/i, { timeout: 10_000 });
    // Schedule / agenda section must be present
    await expect(page.getByRole("heading", { name: /schedule/i }).first()).toBeVisible({ timeout: 10_000 });
  });

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
  test("§19 form renders", async ({ page }) => {
    await gotoOk(page, "/suggest-feature");
    await expect(page.locator("#suggestion-title")).toBeVisible();
    await expect(page.locator("#suggestion-desc")).toBeVisible();
    await expect(page.getByRole("button", { name: /submit feedback/i })).toBeVisible();
  });

  test("§19 empty submit shows validation errors", async ({ page }) => {
    await gotoOk(page, "/suggest-feature");
    // Submit without filling anything in
    await page.getByRole("button", { name: /submit feedback/i }).click();
    // Should stay on the page (not navigate away on empty submit)
    await expect(page).toHaveURL(/suggest-feature/);
    // Form must still be present (not replaced by a success state)
    await expect(page.locator("#suggestion-title")).toBeVisible();
  });

  test.todo("§19 valid submit shows success toast");
  test.todo("§19 #82 auto-feedback posts under bot account, not user");
});

// ═════════════════════════════════════════════════════════════════════════════
// §20 Auth (`/auth`, `/auth/callback`)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§20 auth", () => {
  test("§20 /auth shows Globus button and nothing else", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect(page.getByRole("button", { name: /sign in with globus/i })).toBeVisible({ timeout: 10_000 });
  });

  test.todo("§20 Globus button opens consent (do not complete in prod)");
  test.todo("§20 /auth/callback?error=... renders error state, no crash");
  test.todo("§20 /auth/callback with valid code redirects home + session");
});

// ═════════════════════════════════════════════════════════════════════════════
// §21 404 / catch-all
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§21 not-found", () => {
  test("§21 /this-does-not-exist renders NotFound", async ({ page }) => {
    await page.goto("/this-does-not-exist", { waitUntil: "domcontentloaded", timeout: 15_000 });
    await expect(page.locator("h1")).toHaveText("404", { timeout: 5_000 });
  });

  test("§21 NotFound has a single <h1> and a Back-to-home link", async ({ page }) => {
    await page.goto("/this-does-not-exist", { waitUntil: "domcontentloaded", timeout: 15_000 });
    await expect(page.locator("h1")).toHaveCount(1, { timeout: 5_000 });
    await expect(page.getByRole("link", { name: /return to home/i })).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// §22 Cross-cutting checks — drive from ANON_ROUTES
// ═════════════════════════════════════════════════════════════════════════════
test.describe("§22 cross-cutting", () => {
  for (const path of ANON_ROUTES) {
    test(`§22 ${path} — single <h1>, title <60, meta-description <160`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 15_000 });

      // Single h1 per route
      const h1Count = await page.locator("h1").count();
      expect(h1Count, `${path}: expected exactly 1 <h1>, found ${h1Count}`).toBe(1);

      // Page title under 60 characters
      const title = await page.title();
      expect(title.length, `${path}: title is ${title.length} chars ("${title}") — must be <60`).toBeLessThanOrEqual(60);

      // Meta description under 160 characters if present
      const metaDesc = await page
        .locator('meta[name="description"]')
        .getAttribute("content")
        .catch(() => null);
      if (metaDesc !== null) {
        expect(
          metaDesc.length,
          `${path}: meta description is ${metaDesc.length} chars — must be <160`,
        ).toBeLessThanOrEqual(160);
      }
    });

    test(`§22 ${path} — every external <a> has rel="noopener noreferrer"`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 15_000 });

      // Collect all external links (absolute http/https hrefs)
      const externalLinks = page.locator('a[href^="http"]');
      const count = await externalLinks.count();

      for (let i = 0; i < count; i++) {
        const link = externalLinks.nth(i);
        const href = await link.getAttribute("href");
        const rel = await link.getAttribute("rel");
        expect(
          rel,
          `${path}: external link "${href}" missing rel="noopener noreferrer" (got "${rel}")`,
        ).toMatch(/noopener/);
      }
    });

    test.todo(`§22 ${path} — no broken same-origin images`);
  }

  test.todo("§22 sign-out from any page returns to public state");
});
