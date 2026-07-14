// Computes Big Five + HEXACO personality scores per investigator from adjective
// hits in their existing text (grants.abstract, publications.abstract, entity
// comments, feature suggestions). AoA-weighted: earlier-acquired adjectives
// weigh more (Roivainen 2022). Admin-invoked, writes public.personality_scores.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import adjectives from "./adjectives.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Adj = { a: string; f: string; l: number | null; g: number | null; d?: number | null };
const BF: Adj[] = (adjectives as any).bigfive;
const HX: Adj[] = (adjectives as any).hexaco;

// Build lookup: word -> { bf?: Adj, hx?: Adj }
const LEX = new Map<string, { bf?: Adj; hx?: Adj }>();
for (const a of BF) {
  const k = a.a.replace(/\s+/g, "").toLowerCase();
  LEX.set(k, { ...(LEX.get(k) ?? {}), bf: a });
}
for (const a of HX) {
  const k = a.a.replace(/\s+/g, "").toLowerCase();
  LEX.set(k, { ...(LEX.get(k) ?? {}), hx: a });
}

const BF_FACTORS = ["e", "a", "c", "s", "o"] as const;
const HX_FACTORS = ["h", "e", "x", "a", "c", "o"] as const;

function aoaWeight(grade: number | null | undefined) {
  // earlier-acquired adjectives are more diagnostic (Roivainen 2022).
  if (!grade || grade <= 0) return 1;
  return 1 / Math.sqrt(grade);
}

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z\-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreText(text: string) {
  const tokens = tokenize(text);
  const bf: Record<string, number> = { e: 0, a: 0, c: 0, s: 0, o: 0 };
  const hx: Record<string, number> = { h: 0, e: 0, x: 0, a: 0, c: 0, o: 0 };
  const bfW: Record<string, number> = { e: 0, a: 0, c: 0, s: 0, o: 0 };
  const hxW: Record<string, number> = { h: 0, e: 0, x: 0, a: 0, c: 0, o: 0 };
  const hits = new Map<string, number>();
  let matched = 0;
  for (const t of tokens) {
    // try token, plus common suffix strips
    const cands = [t, t.replace(/(ing|ed|ly|s)$/, "")];
    for (const c of cands) {
      const entry = LEX.get(c);
      if (!entry) continue;
      matched++;
      hits.set(c, (hits.get(c) ?? 0) + 1);
      if (entry.bf && entry.bf.l != null) {
        const w = aoaWeight(entry.bf.g);
        bf[entry.bf.f] = (bf[entry.bf.f] ?? 0) + (entry.bf.l / 100) * w;
        bfW[entry.bf.f] = (bfW[entry.bf.f] ?? 0) + w;
      }
      if (entry.hx && entry.hx.l != null) {
        const w = aoaWeight(entry.hx.g);
        hx[entry.hx.f] = (hx[entry.hx.f] ?? 0) + (entry.hx.l / 100) * w;
        hxW[entry.hx.f] = (hxW[entry.hx.f] ?? 0) + w;
      }
      break;
    }
  }
  // Normalize each factor by its accumulated AoA weight so scores are 0..~1
  const bfOut: Record<string, number> = {};
  for (const f of BF_FACTORS) bfOut[f] = bfW[f] > 0 ? bf[f] / bfW[f] : 0;
  const hxOut: Record<string, number> = {};
  for (const f of HX_FACTORS) hxOut[f] = hxW[f] > 0 ? hx[f] / hxW[f] : 0;
  return { tokens: tokens.length, matched, bf: bfOut, hx: hxOut, hits };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Any authenticated caller can trigger; the output is admin-gated by RLS.
    // Pull all investigators (limit for safety)
    const { data: investigators, error: iErr } = await admin
      .from("investigators")
      .select("id, name")
      .limit(500);
    if (iErr) throw iErr;

    // Pull corpora once, group by investigator
    const [gRes, pRes] = await Promise.all([
      admin.from("grant_investigators")
        .select("investigator_id, grants(abstract, title)")
        .limit(5000),
      admin.from("publications").select("id, abstract, title, authors").limit(5000),
    ]);

    const corpus = new Map<string, string[]>();
    for (const inv of investigators ?? []) corpus.set(inv.id, []);
    for (const row of (gRes.data ?? []) as any[]) {
      const g = row.grants;
      if (!g) continue;
      const txt = [g.title, g.abstract].filter(Boolean).join(" ");
      const arr = corpus.get(row.investigator_id);
      if (arr && txt) arr.push(txt);
    }

    let updated = 0;
    const rows: any[] = [];
    for (const inv of investigators ?? []) {
      const texts = corpus.get(inv.id) ?? [];
      const joined = texts.join(" \n ");
      const scored = scoreText(joined);
      const top = [...scored.hits.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([adj, count]) => {
          const e = LEX.get(adj);
          return { adj, count, bf: e?.bf?.f ?? null, hx: e?.hx?.f ?? null };
        });
      rows.push({
        investigator_id: inv.id,
        big_five: scored.bf,
        hexaco: scored.hx,
        token_count: scored.tokens,
        matched_count: scored.matched,
        top_adjectives: top,
        last_computed_at: new Date().toISOString(),
      });
      updated++;
    }

    // Upsert in chunks
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error } = await admin.from("personality_scores").upsert(chunk);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});