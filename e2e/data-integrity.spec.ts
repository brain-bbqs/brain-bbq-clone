import { test, expect, type Request, type Response } from "@playwright/test";

/**
 * Data integrity tests — these would have caught the "investigators view
 * returns 401, table silently empty" regression.
 *
 * For each data page we assert:
 *   1. No failed API requests (4xx/5xx) to Supabase REST or edge functions
 *   2. No console errors
 *   3. The page is NOT showing its empty-state string
 *   4. At least one data row is rendered (AG Grid row or card)
 */

const DATA_PAGES: { path: string; emptyMessage: RegExp; minRows?: number }[] = [
  { path: "/investigators", emptyMessage: /no investigators found/i },
  { path: "/projects", emptyMessage: /no projects found/i },
  { path: "/publications", emptyMessage: /no publications found/i },
  { path: "/resources", emptyMessage: /no resources found/i },
  { path: "/species", emptyMessage: /no species found/i },
];

for (const { path, emptyMessage } of DATA_PAGES) {
  test(`data: ${path} loads rows without API errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: { url: string; status: number }[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // Supabase endpoints that intentionally return 4xx for anon users (not regressions).
    const IGNORED_API_URL_PATTERNS = [
      "analytics_pageviews", // auth-gated analytics table; 401 for anon is by design
    ];

    page.on("response", (res: Response) => {
      const url = res.url();
      const status = res.status();
      // Track failures hitting Supabase REST, RPC, or edge functions
      const isSupabase =
        url.includes("/rest/v1/") ||
        url.includes("/functions/v1/") ||
        url.includes("/rpc/");
      if (isSupabase && status >= 400 && !IGNORED_API_URL_PATTERNS.some((p) => url.includes(p))) {
        failedRequests.push({ url, status });
      }
    });

    await page.goto(path, { waitUntil: "networkidle", timeout: 30_000 });
    // Give grids/queries a moment to settle
    await page.waitForTimeout(2000);

    // 1. No empty-state string visible
    const empty = page.getByText(emptyMessage).first();
    await expect(
      empty,
      `${path} is showing empty state — data did not load`,
    ).toHaveCount(0);

    // 2. At least one data row rendered (AG Grid row OR mobile card OR table row)
    const rowCount = await page
      .locator(
        ".ag-row, [data-testid='entity-card'], [data-testid='mobile-card'], tbody tr",
      )
      .count();
    expect(
      rowCount,
      `${path} rendered 0 rows — table is empty`,
    ).toBeGreaterThan(0);

    // 3. No failed Supabase requests
    expect(
      failedRequests,
      `${path} had failed Supabase requests: ${JSON.stringify(failedRequests, null, 2)}`,
    ).toEqual([]);

    // 4. No console errors (filter out known noisy warnings)
    const realErrors = consoleErrors.filter(
      (e) =>
        !e.includes("Function components cannot be given refs") &&
        !e.includes("Download the React DevTools") &&
        !e.includes("[vite]"),
    );
    expect(
      realErrors,
      `${path} had console errors: ${realErrors.join("\n")}`,
    ).toEqual([]);
  });
}

test("data: anonymous visitors can read public investigator view", async ({ request }) => {
  // Direct API check — would have caught the missing GRANT immediately.
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    "https://vpexxhfpvghlejljwpvt.supabase.co";
  const anonKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U";

  const publicViews = [
    "investigators_public",
    "public_jobs",
  ];

  for (const view of publicViews) {
    const res = await request.get(
      `${supabaseUrl}/rest/v1/${view}?select=*&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
    );
    expect(
      res.status(),
      `Anon SELECT on ${view} should return 200, got ${res.status()}: ${await res.text()}`,
    ).toBe(200);
    const rows = await res.json();
    expect(Array.isArray(rows), `${view} should return an array`).toBe(true);
  }
});

test("data: investigators page wires query result into the grid", async ({ page }) => {
  // Specifically guards the regression where the REST call succeeds but the
  // page renders nothing.
  await page.goto("/investigators", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const empty = await page.getByText(/no investigators found/i).count();
  expect(empty, "Investigators page is showing 'No investigators found'").toBe(0);

  const rows = await page.locator(".ag-row, [data-testid='mobile-card']").count();
  expect(rows, "Investigators grid rendered 0 rows").toBeGreaterThan(0);
});
