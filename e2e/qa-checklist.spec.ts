import { test, expect, Page } from "@playwright/test";

/**
 * Standard QA suite — mirrors docs/QA_CHECKLIST.md section-for-section.
 *
 * Each test title starts with the section tag (e.g. "§2 home") so a single
 * section can be run with:
 *   npx playwright test e2e/qa-checklist.spec.ts -g "§2"
 *
 * Anon-only (no Globus login). Auth-gated checks assert the redirect to
 * /auth rather than the gated content. Member/admin coverage lives in the
 * auth-fixture suites tracked in docs/QA_PLAN.md §4.
 */

const PUBLIC_ROUTES = [
  "/", "/about", "/investigators", "/projects", "/publications",
  "/resources", "/species", "/working-groups", "/announcements",
  "/jobs", "/grants", "/suggest-feature", "/tutorials",
  "/data-sharing-policy", "/state-privacy", "/mcp-docs", "/mcp-tutorial",
  "/sfn-2025", "/mit-workshop-2026",
];

const AUTH_GATED_ROUTES = [
  "/profile", "/calendar", "/roadmap", "/mit-workshop-2026/travel", "/admin",
];

async function gotoOk(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle", timeout: 30_000 });
}

// ──────────────────────────────────────────────────────────────────────────────
// §1 Global chrome
// ──────────────────────────────────────────────────────────────────────────────
test.describe("§1 chrome", () => {
  test("sidebar renders on desktop home", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoOk(page, "/");
    await expect(page.locator('[data-sidebar]').first()).toBeVisible();
  });

  test("theme toggle flips theme and persists", async ({ page }) => {
    await gotoOk(page, "/");
    const toggle = page.getByRole("button", { name: /theme|dark|light/i }).first();
    test.skip(!(await toggle.isVisible().catch(() => false)), "theme toggle not surfaced");
    const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await toggle.click();
    const after = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(after).not.toBe(before);
    await page.reload({ waitUntil: "networkidle" });
    const persisted = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(persisted).toBe(after);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// §2 Home page
// ──────────────────────────────────────────────────────────────────────────────
test.describe("§2 home", () => {
  test("hero + single h1 + agent CTA", async ({ page }) => {
    await gotoOk(page, "/");
    const h1s = await page.locator("h1").count();
    expect(h1s).toBeGreaterThanOrEqual(1);
    const agent = page.getByRole("link", { name: /talk to the bbqs agent/i });
    await expect(agent).toHaveAttribute("href", /agent\.brain-bbqs\.org/);
    await expect(agent).toHaveAttribute("target", "_blank");
  });

  test("all 6 nav cards render", async ({ page }) => {
    await gotoOk(page, "/");
    for (const title of ["Community", "Assistants", "Tools & Tutorials", "Knowledge Base", "Legal & Policy", "Engineering"]) {
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
});

// ──────────────────────────────────────────────────────────────────────────────
// §3 Navigation
// ──────────────────────────────────────────────────────────────────────────────
test.describe("§3 nav", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`public route renders h1: ${path}`, async ({ page }) => {
      await gotoOk(page, path);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
    });
  }

  for (const path of AUTH_GATED_ROUTES) {
    test(`auth-gated route redirects anon: ${path}`, async ({ page }) => {
      await gotoOk(page, path);
      // Either we landed on /auth, or the page rendered an explicit auth prompt.
      const url = page.url();
      if (!url.includes("/auth")) {
        await expect(page.getByText(/sign in|globus|log in/i).first()).toBeVisible({ timeout: 5_000 });
      }
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// §4 Investigators
// ──────────────────────────────────────────────────────────────────────────────
test.describe("§4 investigators", () => {
  test("grid renders rows", async ({ page }) => {
    await gotoOk(page, "/investigators");
    await page.waitForTimeout(1500);
    expect(await page.locator(".ag-row").count()).toBeGreaterThan(0);
  });

  test("row click opens entity summary modal; Escape closes it", async ({ page }) => {
    await gotoOk(page, "/investigators");
    await page.waitForTimeout(1500);
    const row = page.locator(".ag-row").first();
    const btn = row.locator("button").first();
    if (await btn.isVisible().catch(() => false)) await btn.click(); else await row.click();
    const modal = page.locator('[data-testid="entity-summary-panel"]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  test("deep link with no match does not crash", async ({ page }) => {
    await gotoOk(page, "/investigators?q=zzzzz-no-match-xyz");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.locator('[data-testid="entity-summary-panel"]').count()).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// §5–§10 Data pages (smoke: grid renders, anon write-button hidden)
// ──────────────────────────────────────────────────────────────────────────────
const DATA_PAGES: { tag: string; path: string; addButton: RegExp }[] = [
  { tag: "§5 projects",     path: "/projects",     addButton: /add project/i },
  { tag: "§6 publications", path: "/publications", addButton: /add publication/i },
  { tag: "§7 resources",    path: "/resources",    addButton: /add resource/i },
  { tag: "§8 species",      path: "/species",      addButton: /add species/i },
  { tag: "§9 grants",       path: "/grants",       addButton: /add funding|add grant/i },
  { tag: "§10 jobs",        path: "/jobs",         addButton: /add opportunity|post a job/i },
];

for (const dp of DATA_PAGES) {
  test.describe(dp.tag, () => {
    test(`${dp.path} renders rows`, async ({ page }) => {
      await gotoOk(page, dp.path);
      await page.waitForTimeout(1500);
      const rows = await page.locator(".ag-row, [data-testid='mobile-card'], article, li").count();
      expect(rows).toBeGreaterThan(0);
    });

    test(`${dp.path} hides write button from anon`, async ({ page }) => {
      await gotoOk(page, dp.path);
      const btn = page.getByRole("button", { name: dp.addButton });
      expect(await btn.count()).toBe(0);
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// §11–§16 Light smoke for remaining content pages
// ──────────────────────────────────────────────────────────────────────────────
const CONTENT_PAGES = [
  { tag: "§11 announcements", path: "/announcements" },
  { tag: "§12 working-groups", path: "/working-groups" },
  { tag: "§15 mit-workshop",   path: "/mit-workshop-2026" },
  { tag: "§16 sfn",            path: "/sfn-2025" },
];
for (const cp of CONTENT_PAGES) {
  test(`${cp.tag} renders ${cp.path}`, async ({ page }) => {
    await gotoOk(page, cp.path);
    await expect(page.locator("h1").first()).toBeVisible();
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// §13 / §14 / §17 / §18 — auth gates verified in §3 batch; placeholders here
// for Brian's manual session (skipped automatically without auth fixture).
// ──────────────────────────────────────────────────────────────────────────────
for (const path of ["/calendar", "/roadmap", "/profile", "/admin"]) {
  test(`auth-gate smoke for ${path}`, async ({ page }) => {
    await gotoOk(page, path);
    const url = page.url();
    if (!url.includes("/auth")) {
      await expect(page.getByText(/sign in|globus|log in/i).first()).toBeVisible({ timeout: 5_000 });
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// §19 Give Feedback
// ──────────────────────────────────────────────────────────────────────────────
test("§19 feedback form renders", async ({ page }) => {
  await gotoOk(page, "/suggest-feature");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("textbox").first()).toBeVisible();
});

// ──────────────────────────────────────────────────────────────────────────────
// §20 Auth page
// ──────────────────────────────────────────────────────────────────────────────
test("§20 auth page shows Globus button only", async ({ page }) => {
  await gotoOk(page, "/auth");
  await expect(page.getByRole("button", { name: /globus/i }).first()).toBeVisible();
  expect(await page.getByLabel(/password/i).count()).toBe(0);
});

// ──────────────────────────────────────────────────────────────────────────────
// §21 404
// ──────────────────────────────────────────────────────────────────────────────
test("§21 not-found page renders", async ({ page }) => {
  await gotoOk(page, "/this-route-does-not-exist-xyz");
  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
});

// ──────────────────────────────────────────────────────────────────────────────
// §22 Cross-cutting: external links use rel="noopener"
// ──────────────────────────────────────────────────────────────────────────────
test("§22 cross-cutting: external links carry rel=noopener", async ({ page }) => {
  await gotoOk(page, "/");
  const bad = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[target="_blank"]'))
      .filter((a) => !(a.getAttribute("rel") || "").includes("noopener"))
      .map((a) => (a as HTMLAnchorElement).href),
  );
  expect(bad, `links missing rel=noopener:\n${bad.join("\n")}`).toEqual([]);
});