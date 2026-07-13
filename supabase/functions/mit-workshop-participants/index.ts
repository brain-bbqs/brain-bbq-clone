import { getCorsHeaders } from "../_shared/auth.ts";

/**
 * mit-workshop-participants
 * Fetches the BBQS MIT Workshop 2026 registration responses from the
 * Google Form "Form Responses 1" sheet (CSV export), de-duplicates by
 * email (falling back to normalized name), and returns a clean list of
 * participants. The sheet must be shared as "Anyone with the link".
 */

const SHEET_ID = "1dNoYYPF2cDqOAzn1PeJlx2aBVuOz8szWWI4mm4nZcuc";
// The workbook has two tabs we care about:
//   * Form Responses 1  (gid=358008666) — live-updating from the registration
//     form; source of truth for anything the user tests by submitting the form.
//   * NameTags          (gid=912781162) — curated roster for name tags. Some
//     participants only exist here (added by hand before the form went live).
// We fetch BOTH and merge, so newly submitted form responses appear immediately
// while the curated entries continue to show up for legacy attendees.
const FORM_GID = "358008666";
const ROSTER_GID = "912781162";
// Cache-busting `t=` param defeats Google's CDN cache so edits appear live.
const csvUrl = (gid: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}&range=A1:Z5000&t=${Date.now()}`;

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
    const fetchRows = async (gid: string) => {
      const r = await fetch(csvUrl(gid), {
        redirect: "follow",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      });
      if (!r.ok) throw new Error(`sheet_fetch_failed:${gid}:${r.status}`);
      return parseCsv(await r.text());
    };

    const extract = (rows: string[][]) => {
      const out: Array<{ name: string; email: string; institution: string; role: string; attendance: string; ts: string }> = [];
      if (rows.length < 2) return out;
      const header = rows[0].map((h) => h.toLowerCase());
      const col = (needles: string[]) =>
        header.findIndex((h) => needles.some((n) => h.includes(n)));
      const iName = col(["full name", "name"]);
      const iInst = col(["institution", "affiliation", "organization"]);
      const iRole = col(["role in bbqs", "primary role", "role with bbqs", "role"]);
      const iEmail = col(["email address", "email"]);
      const iAttend = col(["attendance", "plan to attend", "attend"]);
      const iTs = col(["timestamp"]);
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every((c) => !norm(c))) continue;
        const name = iName >= 0 ? norm(row[iName]) : "";
        const email = iEmail >= 0 ? normKey(row[iEmail]) : "";
        if (!name && !email) continue;
        out.push({
          name,
          email,
          institution: iInst >= 0 ? norm(row[iInst]) : "",
          role: iRole >= 0 ? norm(row[iRole]) : "",
          attendance: iAttend >= 0 ? norm(row[iAttend]) : "",
          ts: iTs >= 0 ? norm(row[iTs]) : "",
        });
      }
      return out;
    };

    // Fetch both tabs in parallel; tolerate one failing.
    const [formRes, rosterRes] = await Promise.allSettled([
      fetchRows(FORM_GID),
      fetchRows(ROSTER_GID),
    ]);
    const formRows = formRes.status === "fulfilled" ? extract(formRes.value) : [];
    const rosterRows = rosterRes.status === "fulfilled" ? extract(rosterRes.value) : [];
    if (formRes.status === "rejected" && rosterRes.status === "rejected") {
      return new Response(
        JSON.stringify({ ok: false, error: "sheet_fetch_failed" }),
        { status: 502, headers: jsonHeaders },
      );
    }

    // Merge: form responses take precedence (live source), roster fills in
    // legacy names not represented in the form.
    const seen = new Map<string, any>();
    const upsert = (p: any, prefer: boolean) => {
      // Always key by normalized name — the roster tab has no email column,
      // so keying by email would produce duplicate rows for the same person.
      const key = normKey(p.name);
      if (!key) return;
      const prev = seen.get(key);
      if (!prev) { seen.set(key, p); return; }
      if (prefer) { seen.set(key, p); return; }
      // If same source, keep the most recent by timestamp.
      const pt = Date.parse(prev.ts || "");
      const ct = Date.parse(p.ts || "");
      if (!isNaN(ct) && (isNaN(pt) || ct >= pt)) seen.set(key, p);
    };
    // Seed with roster first, then overwrite with form responses (live).
    for (const p of rosterRows) upsert(p, false);
    for (const p of formRows) upsert(p, true);

    const participants = Array.from(seen.values())
      .map((p) => ({
        name: p.name,
        institution: p.institution,
        role: p.role,
        attendance: p.attendance,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({
        ok: true,
        count: participants.length,
        participants,
        fetched_at: new Date().toISOString(),
        sources: {
          form: formRes.status === "fulfilled" ? formRows.length : `error:${(formRes as any).reason?.message}`,
          roster: rosterRes.status === "fulfilled" ? rosterRows.length : `error:${(rosterRes as any).reason?.message}`,
        },
      }),
      { headers: { ...jsonHeaders, "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
      { status: 500, headers: jsonHeaders },
    );
  }
});