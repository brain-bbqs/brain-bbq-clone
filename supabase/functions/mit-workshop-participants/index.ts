import { getCorsHeaders } from "../_shared/auth.ts";

/**
 * mit-workshop-participants
 * Fetches the BBQS MIT Workshop 2026 registration responses from the
 * Google Form "Form Responses 1" sheet (CSV export), de-duplicates by
 * email (falling back to normalized name), and returns a clean list of
 * participants. The sheet must be shared as "Anyone with the link".
 */

const SHEET_ID = "1dNoYYPF2cDqOAzn1PeJlx2aBVuOz8szWWI4mm4nZcuc";
// The live form responses live on the first tab (gid=0). A stale
// "Form Responses 1" tab still exists with a partial snapshot (~34 rows),
// so we intentionally fetch the first sheet by gid to get the full list.
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

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

function norm(s: string) { return (s || "").trim().replace(/\s+/g, " "); }
function normKey(s: string) { return norm(s).toLowerCase(); }

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
      return new Response(JSON.stringify({ ok: true, participants: [], count: 0 }), { headers: jsonHeaders });
    }
    const header = rows[0].map((h) => h.toLowerCase());
    const col = (needles: string[]) =>
      header.findIndex((h) => needles.some((n) => h.includes(n)));

    const iName = col(["full name", "name"]);
    const iInst = col(["institution", "affiliation", "organization"]);
    const iRole = col(["primary role", "role with bbqs", "role"]);
    const iEmail = col(["email address", "email"]);
    const iAttend = col(["plan to attend", "attend"]);
    const iTs = col(["timestamp"]);

    const seen = new Map<string, any>();
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => !norm(c))) continue;
      const name = iName >= 0 ? norm(row[iName]) : "";
      const email = iEmail >= 0 ? normKey(row[iEmail]) : "";
      const institution = iInst >= 0 ? norm(row[iInst]) : "";
      const role = iRole >= 0 ? norm(row[iRole]) : "";
      const attendance = iAttend >= 0 ? norm(row[iAttend]) : "";
      const ts = iTs >= 0 ? norm(row[iTs]) : "";
      if (!name && !email) continue;
      const key = email || normKey(name);
      const prev = seen.get(key);
      // keep the most recent entry per key
      const cand = { name, email, institution, role, attendance, ts };
      if (!prev) seen.set(key, cand);
      else {
        const pt = Date.parse(prev.ts || "");
        const ct = Date.parse(cand.ts || "");
        if (!isNaN(ct) && (isNaN(pt) || ct >= pt)) seen.set(key, cand);
      }
    }

    const participants = Array.from(seen.values())
      .map((p) => ({
        name: p.name,
        institution: p.institution,
        role: p.role,
        attendance: p.attendance,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({ ok: true, count: participants.length, participants, fetched_at: new Date().toISOString() }),
      { headers: { ...jsonHeaders, "Cache-Control": "public, max-age=300" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
      { status: 500, headers: jsonHeaders },
    );
  }
});