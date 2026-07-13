// Internal research worker — admin-only. Computes psycholinguistic profiles
// and mutual-vocabulary similarity per investigator, and writes results to
// the internal_research schema. No client-side code should reference the
// underlying purpose; this function is deliberately named blandly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/auth.ts";
import { DICT, STOPWORDS, type Category } from "./dict.ts";

type Mode = "drain" | "backfill" | "snapshot";

interface CorpusRow {
  investigator_id: string;
  text: string;
  source: "grant" | "publication" | "comment" | "suggestion";
}

function tokenize(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreLiwc(tokens: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cat of Object.keys(DICT) as Category[]) counts[cat] = 0;
  let longWords = 0;
  for (const tok of tokens) {
    if (tok.length > 6) longWords++;
    for (const cat of Object.keys(DICT) as Category[]) {
      for (const stem of DICT[cat]) {
        if (tok.startsWith(stem)) { counts[cat]++; break; }
      }
    }
  }
  const total = Math.max(tokens.length, 1);
  const pct: Record<string, number> = { long_words: longWords / total };
  for (const cat of Object.keys(counts)) pct[cat] = counts[cat] / total;
  return pct;
}

function personalityScore(liwc: Record<string, number>, weights: Record<string, number>): number {
  let s = 0;
  for (const [k, w] of Object.entries(weights)) s += (liwc[k] ?? 0) * (w as number);
  return s;
}

function tfidfVec(tokens: string[], idf: Record<string, number>): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokens) {
    if (t.length < 3 || STOPWORDS.has(t) || /^\d+$/.test(t)) continue;
    tf[t] = (tf[t] ?? 0) + 1;
  }
  const vec: Record<string, number> = {};
  const denom = Math.max(tokens.length, 1);
  for (const [term, c] of Object.entries(tf)) {
    if (!(term in idf)) continue;
    vec[term] = (c / denom) * idf[term];
  }
  return vec;
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const [k, v] of Object.entries(a)) { na += v * v; if (k in b) dot += v * b[k]; }
  for (const v of Object.values(b)) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

function zscore(xs: number[]): number[] {
  const n = xs.length;
  if (n === 0) return xs;
  const mean = xs.reduce((s, x) => s + x, 0) / n;
  const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance) || 1;
  return xs.map((x) => (x - mean) / sd);
}

async function requireAdmin(req: Request, url: string, anon: string): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;
  try {
    const client = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return false;
    const { data } = await client.from("user_roles").select("role").eq("user_id", user.id);
    return (data ?? []).some((r: any) => r.role === "admin");
  } catch { return false; }
}

async function loadCorpus(admin: ReturnType<typeof createClient>, investigatorIds: string[] | null): Promise<CorpusRow[]> {
  const rows: CorpusRow[] = [];

  // grants → investigators via grant_investigators
  let gq = admin.from("grants").select("id, abstract, grant_investigators!inner(investigator_id)");
  const { data: grants } = await gq;
  for (const g of (grants ?? []) as any[]) {
    if (!g.abstract) continue;
    for (const gi of g.grant_investigators ?? []) {
      if (investigatorIds && !investigatorIds.includes(gi.investigator_id)) continue;
      rows.push({ investigator_id: gi.investigator_id, text: g.abstract, source: "grant" });
    }
  }

  // publications (title only — no abstract column)
  const { data: pubs } = await admin
    .from("publications")
    .select("id, title, project_publications!inner(project_id, projects!inner(grant_id, grants!inner(id, grant_investigators!inner(investigator_id))))");
  for (const p of (pubs ?? []) as any[]) {
    if (!p.title) continue;
    const invSet = new Set<string>();
    for (const pp of p.project_publications ?? []) {
      const gs = pp.projects?.grants;
      const list = Array.isArray(gs) ? gs : gs ? [gs] : [];
      for (const g of list) for (const gi of g.grant_investigators ?? []) invSet.add(gi.investigator_id);
    }
    for (const invId of invSet) {
      if (investigatorIds && !investigatorIds.includes(invId)) continue;
      rows.push({ investigator_id: invId, text: p.title, source: "publication" });
    }
  }

  // comments — join user_id → investigators
  const { data: comments } = await admin.from("entity_comments").select("user_id, content");
  const { data: suggestions } = await admin.from("feature_suggestions").select("submitted_by, description");
  const { data: invs } = await admin.from("investigators").select("id, user_id");
  const userToInv = new Map<string, string>();
  for (const i of (invs ?? []) as any[]) if (i.user_id) userToInv.set(i.user_id, i.id);
  for (const c of (comments ?? []) as any[]) {
    const invId = userToInv.get(c.user_id);
    if (!invId || !c.content) continue;
    if (investigatorIds && !investigatorIds.includes(invId)) continue;
    rows.push({ investigator_id: invId, text: c.content, source: "comment" });
  }
  for (const s of (suggestions ?? []) as any[]) {
    const invId = userToInv.get(s.submitted_by);
    if (!invId || !s.description) continue;
    if (investigatorIds && !investigatorIds.includes(invId)) continue;
    rows.push({ investigator_id: invId, text: s.description, source: "suggestion" });
  }

  return rows;
}

async function compute(admin: ReturnType<typeof createClient>, investigatorIds: string[] | null) {
  const corpus = await loadCorpus(admin, investigatorIds);

  // Per-investigator token pool + separate "science-only" pool (grants + pubs).
  const allTokens = new Map<string, string[]>();
  const sciTokens = new Map<string, string[]>();
  for (const row of corpus) {
    const toks = tokenize(row.text);
    if (!allTokens.has(row.investigator_id)) allTokens.set(row.investigator_id, []);
    allTokens.get(row.investigator_id)!.push(...toks);
    if (row.source === "grant" || row.source === "publication") {
      if (!sciTokens.has(row.investigator_id)) sciTokens.set(row.investigator_id, []);
      sciTokens.get(row.investigator_id)!.push(...toks);
    }
  }

  // IDF across investigators (science-only corpus).
  const df: Record<string, number> = {};
  for (const toks of sciTokens.values()) {
    const uniq = new Set(toks.filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t)));
    for (const t of uniq) df[t] = (df[t] ?? 0) + 1;
  }
  const N = Math.max(sciTokens.size, 1);
  const idf: Record<string, number> = {};
  for (const [t, d] of Object.entries(df)) idf[t] = Math.log((N + 1) / (d + 1)) + 1;

  // TF-IDF vectors.
  const vecs = new Map<string, Record<string, number>>();
  for (const [inv, toks] of sciTokens) vecs.set(inv, tfidfVec(toks, idf));

  // Weights.
  const { data: cfgRows } = await admin.from("interactional_config").select("key, value");
  const cfg: Record<string, any> = {};
  for (const r of (cfgRows ?? []) as any[]) cfg[r.key] = r.value;
  const weights: Record<string, number> = cfg.personality_weights ?? {};

  // Score each investigator.
  const invIds = Array.from(allTokens.keys());
  const personalityRaw: number[] = [];
  const scienceRaw: number[] = [];
  const liwcs: Record<string, Record<string, number>> = {};
  const tokenCounts: Record<string, number> = {};

  for (const inv of invIds) {
    const toks = allTokens.get(inv)!;
    const liwc = scoreLiwc(toks);
    liwcs[inv] = liwc;
    tokenCounts[inv] = toks.length;
    personalityRaw.push(personalityScore(liwc, weights));
  }

  for (const inv of invIds) {
    const v = vecs.get(inv);
    if (!v) { scienceRaw.push(0); continue; }
    let sum = 0, n = 0;
    for (const [other, ov] of vecs) {
      if (other === inv) continue;
      sum += cosine(v, ov); n++;
    }
    scienceRaw.push(n > 0 ? sum / n : 0);
  }

  const pz = zscore(personalityRaw);
  const sz = zscore(scienceRaw);

  // Write.
  const rows = invIds.map((inv, i) => ({
    investigator_id: inv,
    liwc: liwcs[inv],
    personality_score: pz[i],
    science_score: sz[i],
    adhesion: 0.5 * pz[i] + 0.5 * sz[i],
    token_count: tokenCounts[inv],
    last_computed_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error } = await admin.rpc("ir_upsert_profiles", { _rows: rows });
    if (error) throw error;
  }

  return { computed: rows.length };
}

async function snapshot(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin.rpc("ir_snapshot_now");
  if (error) throw error;
  return { snapshots: data ?? 0 };
}

Deno.serve(async (req) => {
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const isAdmin = await requireAdmin(req, url, anon);
  if (!isAdmin) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const mode: Mode = body.mode ?? "backfill";

  try {
    const admin = createClient(url, service, { db: { schema: "public" } });
    if (mode === "snapshot") {
      const r = await snapshot(admin);
      return new Response(JSON.stringify(r), { headers });
    }
    if (mode === "drain") {
      const { data: q, error: qErr } = await admin.rpc("ir_drain_queue", { _limit: 200 });
      if (qErr) throw qErr;
      const ids = (q ?? []).map((r: any) => r.investigator_id);
      if (ids.length === 0) return new Response(JSON.stringify({ computed: 0 }), { headers });
      const r = await compute(admin, ids);
      return new Response(JSON.stringify(r), { headers });
    }
    const r = await compute(admin, null);
    return new Response(JSON.stringify(r), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});