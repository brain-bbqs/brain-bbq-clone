import { test, expect } from "@playwright/test";

/**
 * Walks every public route and fails on:
 *   - Uncaught JS errors (page errors)
 *   - Console errors (filtered for known noise)
 *   - Failed Supabase API calls (4xx/5xx)
 *   - Broken images (naturalWidth === 0)
 */

const ROUTES = [
  "/",
  "/about",
  "/projects",
  "/investigators",
  "/publications",
  "/resources",
  "/species",
  "/working-groups",
  "/announcements",
  "/roadmap",
  "/jobs",
  "/grants",
  "/tutorials",
  "/data-sharing-policy",
  "/state-privacy",
  "/suggest-feature",
  "/mcp-docs",
  "/mcp-tutorial",
  "/sfn-2025",
  "/mit-workshop-2026",
  "/mit-workshop-2026/travel",
  "/cross-species-synchronization",
  "/data-provenance",
];

const IGNORED_CONSOLE = [
  "Function components cannot be given refs",
  "Download the React DevTools",
  "[vite]",
  "Failed to load resource: the server responded with a status of 404", // favicons etc
  "Failed to load resource: the server responded with a status of 401", // unauthenticated optional calls
  "validateDOMNesting",
  "X-Frame-Options may only be set via an HTTP header", // meta tag warning from third-party content
  "data:font/", // base64-embedded font CSP noise
];

for (const route of ROUTES) {
  test(`page health: ${route}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const apiFailures: { url: string; status: number }[] = [];

    page.on("pageerror", (e) => pageErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORED_CONSOLE.some((s) => text.includes(s))) return;
      consoleErrors.push(text);
    });
    page.on("response", (res) => {
      const url = res.url();
      const status = res.status();
      if (
        status >= 400 &&
        (url.includes("/rest/v1/") ||
          url.includes("/functions/v1/") ||
          url.includes("/rpc/"))
      ) {
        apiFailures.push({ url, status });
      }
    });

    await page.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(1500);

    // h1 must exist and be visible
    const h1 = page.locator("h1").first();
    await expect(h1, `${route} is missing an h1`).toBeVisible({ timeout: 10_000 });

    // No NotFound page leaked
    const notFound = await page.getByText(/404|page not found/i).count();
    expect(notFound, `${route} rendered NotFound`).toBe(0);

    // No uncaught exceptions
    expect(pageErrors, `${route} threw: ${pageErrors.join(" | ")}`).toEqual([]);

    // No console errors
    expect(
      consoleErrors,
      `${route} console errors:\n${consoleErrors.join("\n")}`,
    ).toEqual([]);

    // No failed Supabase calls
    expect(
      apiFailures,
      `${route} API failures:\n${JSON.stringify(apiFailures, null, 2)}`,
    ).toEqual([]);

    // No broken <img> elements
    const broken = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .filter((img) => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith("data:"))
        .map((img) => img.src),
    );
    expect(broken, `${route} broken images: ${broken.join(", ")}`).toEqual([]);
  });
}
