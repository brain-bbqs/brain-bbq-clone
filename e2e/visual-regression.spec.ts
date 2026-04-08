import { test, expect } from "@playwright/test";

/**
 * Visual regression suite — captures a full-page screenshot of every public
 * route and compares against committed baseline snapshots.
 *
 * Update baselines:  npx playwright test --update-snapshots
 */

const PUBLIC_PAGES: { name: string; path: string; waitUntil?: "networkidle" | "domcontentloaded" }[] = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "projects", path: "/projects" },
  { name: "investigators", path: "/investigators" },
  { name: "publications", path: "/publications" },
  { name: "resources", path: "/resources" },
  { name: "species", path: "/species" },
  { name: "working-groups", path: "/working-groups" },
  { name: "announcements", path: "/announcements" },
  { name: "roadmap", path: "/roadmap" },
  { name: "jobs", path: "/jobs" },
  { name: "calendar", path: "/calendar", waitUntil: "domcontentloaded" },
  { name: "grants", path: "/grants" },
  { name: "tutorials", path: "/tutorials" },
  { name: "consortia-history", path: "/consortia-history" },
  { name: "data-sharing-policy", path: "/data-sharing-policy" },
  { name: "state-privacy", path: "/state-privacy" },
  { name: "suggest-feature", path: "/suggest-feature" },
  { name: "mcp-docs", path: "/mcp-docs" },
  { name: "mcp-tutorial", path: "/mcp-tutorial" },
  { name: "neuromcp", path: "/neuromcp" },
  { name: "sfn-2025", path: "/sfn-2025" },
  { name: "mit-workshop-2026", path: "/mit-workshop-2026" },
  { name: "mit-workshop-travel", path: "/mit-workshop-2026/travel" },
  { name: "data-provenance", path: "/data-provenance" },
  { name: "metadata-assistant", path: "/metadata-assistant" },
  { name: "dandi-assistant", path: "/dandi-assistant", waitUntil: "domcontentloaded" },
];

for (const page of PUBLIC_PAGES) {
  test(`visual: ${page.name}`, async ({ page: p }) => {
    await p.goto(page.path, { waitUntil: page.waitUntil ?? "networkidle", timeout: 60000 });

    // Wait for any loading spinners to disappear
    await p.waitForTimeout(1000);

    // Hide dynamic content that changes between runs
    await p.evaluate(() => {
      // Hide timestamps, animated elements, etc.
      document.querySelectorAll("[data-testid='timestamp'], .animate-spin").forEach((el) => {
        (el as HTMLElement).style.visibility = "hidden";
      });
    });

    await expect(p).toHaveScreenshot(`${page.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}

test("visual: 404 page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist", { waitUntil: "networkidle" });
  await expect(page).toHaveScreenshot("404.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
  });
});
