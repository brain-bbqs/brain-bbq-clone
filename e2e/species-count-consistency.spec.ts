import { test, expect } from "@playwright/test";

/**
 * Guards against the regression where the Species directory shows N projects
 * for a species (e.g. "House Mouse · 7"), but opening the species summary
 * modal lists a different number of related projects.
 *
 * Both numbers must be derived from the same source of truth (YAML).
 */

test("species: directory count matches modal related-project count", async ({ page }) => {
  await page.goto("/species", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Grab every species row (badge + count) from the AG Grid.
  const rows = page.locator(".ag-row");
  const rowCount = await rows.count();
  expect(rowCount, "Species table rendered no rows").toBeGreaterThan(0);

  // Sample the first 5 species rows for cross-check.
  const sampleSize = Math.min(5, rowCount);
  for (let i = 0; i < sampleSize; i++) {
    const row = rows.nth(i);
    const button = row.locator("button").first();
    const label = (await button.textContent())?.trim() || "";
    // Last numeric token in the badge is the project count.
    const m = label.match(/(\d+)\s*$/);
    if (!m) continue;
    const tableCount = parseInt(m[1], 10);

    await button.click();
    // Modal opens; switch to Projects tab.
    await page.getByRole("tab", { name: /projects/i }).click();
    await page.waitForTimeout(500);

    // Count project entries in the Projects tab content.
    const modalProjectButtons = page.locator(
      '[role="dialog"] button:has-text("DA"), [role="dialog"] button:has-text("MH")',
    );
    const modalCount = await modalProjectButtons.count();

    expect(
      modalCount,
      `Species "${label}" shows ${tableCount} in directory but ${modalCount} in modal`,
    ).toBe(tableCount);

    // Close modal before next iteration.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
});