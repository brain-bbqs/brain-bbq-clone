import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verify that core pages load without console errors
 * and render expected landmark elements.
 */

const CRITICAL_PAGES = [
  { path: "/", heading: /bbqs|brain/i },
  { path: "/projects", heading: /projects/i },
  { path: "/investigators", heading: /investigators|people/i },
  { path: "/publications", heading: /publications/i },
  { path: "/resources", heading: /resources/i },
  { path: "/species", heading: /species/i },
];

for (const { path, heading } of CRITICAL_PAGES) {
  test(`smoke: ${path} loads and renders heading`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(path, { waitUntil: "networkidle" });

    // Should have an h1
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 10_000 });
    await expect(h1).toHaveText(heading);

    // No uncaught JS errors
    expect(errors).toEqual([]);
  });
}

test("smoke: sidebar navigation works", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // Open sidebar if collapsed (mobile)
  const trigger = page.locator("[data-sidebar='trigger']").first();
  if (await trigger.isVisible()) {
    await trigger.click();
  }

  // Click Projects link
  const projectsLink = page.getByRole("link", { name: /projects/i }).first();
  if (await projectsLink.isVisible()) {
    await projectsLink.click();
    await page.waitForURL("**/projects");
    await expect(page.locator("h1").first()).toBeVisible();
  }
});
