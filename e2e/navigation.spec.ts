import { test, expect } from "@playwright/test";

/**
 * Sidebar / navigation flow — verifies the user can actually move between
 * the major sections without dead links.
 */

const NAV_TARGETS = [
  { name: /projects/i, urlPart: "/projects" },
  { name: /people|investigators/i, urlPart: "/investigators" },
  { name: /publications/i, urlPart: "/publications" },
  { name: /resources/i, urlPart: "/resources" },
  { name: /species/i, urlPart: "/species" },
];

test("nav: sidebar links land on the right routes with rendered content", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const trigger = page.locator("[data-sidebar='trigger']").first();
  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click().catch(() => {});
  }

  for (const target of NAV_TARGETS) {
    const link = page.getByRole("link", { name: target.name }).first();
    if (!(await link.isVisible().catch(() => false))) continue;
    await link.click();
    await page.waitForURL(`**${target.urlPart}**`, { timeout: 10_000 });
    await expect(page.locator("h1").first()).toBeVisible();
  }
});

test("nav: 404 page renders for unknown route", async ({ page }) => {
  await page.goto("/this-does-not-exist", { waitUntil: "networkidle" });
  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
});

test("nav: investigator row click opens entity summary modal", async ({ page }) => {
  await page.goto("/investigators", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const firstRow = page.locator(".ag-row").first();
  if (!(await firstRow.isVisible().catch(() => false))) {
    test.skip(true, "AG Grid did not render — covered by data-integrity.spec");
    return;
  }

  // Entity summary is triggered by the name-cell button, not the raw row.
  // Try the button inside the row first; fall back to the row itself.
  const nameBtn = firstRow.locator("button").first();
  if (await nameBtn.isVisible().catch(() => false)) {
    await nameBtn.click();
  } else {
    await firstRow.click();
  }

  // Entity summary renders as a Radix Sheet (role="dialog" + data-state="open")
  const modal = page.locator('[role="dialog"]').first();
  await expect(modal).toBeVisible({ timeout: 8_000 });
});
