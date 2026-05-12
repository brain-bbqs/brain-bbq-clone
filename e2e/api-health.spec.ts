import { test, expect } from "@playwright/test";

/**
 * API health checks — assert that every public-facing Supabase view/table the
 * frontend reads from is actually readable by the anon role. This catches
 * missing GRANTs (the exact bug that broke /investigators).
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://vpexxhfpvghlejljwpvt.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U";

// Tables / views the unauthenticated site must be able to read.
const PUBLIC_READS: { name: string; minRows?: number }[] = [
  { name: "investigators_public", minRows: 1 },
  { name: "public_jobs" },
  { name: "projects", minRows: 1 },
  { name: "grants", minRows: 1 },
  { name: "publications", minRows: 1 },
  { name: "resources", minRows: 1 },
  { name: "species", minRows: 1 },
  { name: "organizations", minRows: 1 },
  { name: "working_groups" },
  { name: "announcements" },
  { name: "feature_suggestions" },
  { name: "grant_investigators" },
  { name: "resource_links" },
];

for (const { name, minRows } of PUBLIC_READS) {
  test(`api: anon can SELECT from ${name}`, async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/${name}?select=*&limit=5`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    expect(
      res.status(),
      `Anon SELECT on ${name} returned ${res.status()}: ${await res.text()}`,
    ).toBe(200);
    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    if (minRows !== undefined) {
      expect(
        rows.length,
        `${name} returned ${rows.length} rows (expected >= ${minRows}). Likely a missing GRANT or RLS regression.`,
      ).toBeGreaterThanOrEqual(minRows);
    }
  });
}

// PII safety: the public investigators view must NOT expose email or phone.
test("api: investigators_public never leaks email or phone columns", async ({ request }) => {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/investigators_public?select=*&limit=5`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
  );
  expect(res.status()).toBe(200);
  const rows = await res.json();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      expect(
        key.toLowerCase(),
        `investigators_public exposed PII column: ${key}`,
      ).not.toMatch(/email|phone|secondary_emails/);
    }
  }
});

// Anon must NOT be able to read the raw investigators table (PII source).
test("api: anon is BLOCKED from raw investigators table", async ({ request }) => {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/investigators?select=email&limit=1`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
  );
  // Should be empty result via RLS (200 with []) or explicit 401/403.
  if (res.status() === 200) {
    const rows = await res.json();
    expect(
      rows.length,
      "Raw investigators table returned rows to anon — PII leak risk",
    ).toBe(0);
  } else {
    expect([401, 403]).toContain(res.status());
  }
});
