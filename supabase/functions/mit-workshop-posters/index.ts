import { getCorsHeaders } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * mit-workshop-posters
 * Reads poster session submissions from the BBQS MIT Workshop 2026 Google Form
 * sheet, de-duplicates by (email + poster title), parses the multi-grant field,
 * and joins each referenced grant against the `grants` table so the UI can link
 * to /projects/:grantNumber/profile.
 */

const SHEET_ID = "1WtnrCFm35pl4yvNW9KdD9ml9NUHhsy9cCgd3ToS6Ro4";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

const norm = (s: string) => (s || "").trim().replace(/\s+/g, " ");
const normKey = (s: string) => norm(s).toLowerCase();

type GrantRef = {
  activity_code: string;   // e.g. "R61", "U01"
  title: string;
  pis: string;
  grant_number: string | null;
  matched_title: string | null;
};

/**
 * Parse the "Grants" cell. Each entry looks like:
 *   "R61: <title> (PI(s): <names>)"
 * Multiple entries are separated by ", " between entries but titles can also
 * contain commas, so we split on the activity-code pattern instead.
 */
function parseGrantsCell(raw: string): { activity_code: string; title: string; pis: string }[] {
  const s = norm(raw);
  if (!s) return [];
  // Find start positions of "<CODE>:" tokens.
  const codeRe = /(?:^|,\s*)([A-Z]\d{2}):\s*/g;
  const starts: { idx: number; code: string; contentStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = codeRe.exec(s)) !== null) {
    starts.push({ idx: m.index, code: m[1], contentStart: m.index + m[0].length });
  }
  if (starts.length === 0) return [];
  const out: { activity_code: string; title: string; pis: string }[] = [];
  for (let i = 0; i < starts.length; i++) {
    const end = i + 1 < starts.length ? starts[i + 1].idx : s.length;
    let chunk = s.slice(starts[i].contentStart, end).trim().replace(/,+\s*$/, "").trim();
    let pis = "";
    const piMatch = chunk.match(/\(PI\(s\):\s*([^)]*)\)\s*$/i);
    if (piMatch) {
      pis = piMatch[1].trim();
      chunk = chunk.slice(0, piMatch.index).trim();
    }
    out.push({ activity_code: starts[i].code, title: chunk, pis });
  }
  return out;
}

function titleKey(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    const res = await fetch(CSV_URL, { redirect: "follow" });
    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: `sheet_fetch_failed:${res.status}` }),
        { status: 502, headers: jsonHeaders },
      );
    }
    const csv = await res.text();
    const rows = parseCsv(csv);
    if (rows.length < 2) {
      return new Response(JSON.stringify({ ok: true, posters: [], count: 0 }), { headers: jsonHeaders });
    }
    const header = rows[0].map((h) => h.toLowerCase());
    const col = (needles: string[]) => header.findIndex((h) => needles.some((n) => h.includes(n)));
    const iName = col(["presenter name", "name"]);
    const iEmail = col(["presenter email", "email"]);
    const iTitle = col(["poster title", "title"]);
    const iGrants = col(["grants"]);
    const iTs = col(["timestamp"]);

    // Load all grants once for title matching.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: grantRows } = await supabase.from("grants").select("grant_number,title");
    const grantIndex = new Map<string, { grant_number: string; title: string }>();
    for (const g of grantRows ?? []) {
      if (g?.title && g?.grant_number) grantIndex.set(titleKey(g.title), g);
    }

    const resolveGrant = (title: string): { grant_number: string; matched_title: string } | null => {
      const key = titleKey(title);
      if (!key) return null;
      const exact = grantIndex.get(key);
      if (exact) return { grant_number: exact.grant_number, matched_title: exact.title };
      // Fallback: prefix / contains match
      for (const [k, g] of grantIndex) {
        if (k.startsWith(key) || key.startsWith(k) || k.includes(key) || key.includes(k)) {
          return { grant_number: g.grant_number, matched_title: g.title };
        }
      }
      return null;
    };

    const seen = new Map<string, any>();
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => !norm(c))) continue;
      const name = iName >= 0 ? norm(row[iName]) : "";
      const email = iEmail >= 0 ? normKey(row[iEmail]) : "";
      const title = iTitle >= 0 ? norm(row[iTitle]) : "";
      const grantsRaw = iGrants >= 0 ? norm(row[iGrants]) : "";
      const ts = iTs >= 0 ? norm(row[iTs]) : "";
      if (!title && !name) continue;
      const key = `${email || normKey(name)}|${titleKey(title)}`;
      const grants: GrantRef[] = parseGrantsCell(grantsRaw).map((g) => {
        const match = resolveGrant(g.title);
        return {
          activity_code: g.activity_code,
          title: g.title,
          pis: g.pis,
          grant_number: match?.grant_number ?? null,
          matched_title: match?.matched_title ?? null,
        };
      });
      const cand = { name, email, title, grants, ts };
      const prev = seen.get(key);
      if (!prev) seen.set(key, cand);
      else {
        const pt = Date.parse(prev.ts || "");
        const ct = Date.parse(cand.ts || "");
        if (!isNaN(ct) && (isNaN(pt) || ct >= pt)) seen.set(key, cand);
      }
    }

    const posters = Array.from(seen.values())
      .map((p) => ({ name: p.name, title: p.title, grants: p.grants }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({ ok: true, count: posters.length, posters, fetched_at: new Date().toISOString() }),
      { headers: { ...jsonHeaders, "Cache-Control": "public, max-age=300" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String((e as any)?.message ?? e) }),
      { status: 500, headers: jsonHeaders },
    );
  }
});