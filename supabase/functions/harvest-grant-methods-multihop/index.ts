import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, requireAuth } from "../_shared/auth.ts";

// ─────────────────────── External APIs ───────────────────────
const REPORTER = "https://api.reporter.nih.gov/v2";
const FIRECRAWL = "https://api.firecrawl.dev/v2/scrape";
const ICITE = "https://icite.od.nih.gov/api/pubs";
const AI = "https://ai.gateway.lovable.dev/v1";

type NodeRef = {
  type: string;
  id: string;          // canonical id (grant number, pmid, uuid)
  label?: string;
  text?: string;       // for embedding
  payload?: any;       // full data passthrough for extractor
};
type PathStep = { node: NodeRef; relation_in: string | null; hop: number; score: number };
type Path = PathStep[];

// ─────────────────────── Embeddings ───────────────────────
async function embed(text: string, key: string): Promise<number[] | null> {
  if (!text) return null;
  const res = await fetch(`${AI}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-embedding-001", input: text.slice(0, 8000) }),
  });
  if (!res.ok) { console.error("embed", res.status, await res.text()); return null; }
  const j = await res.json();
  return j?.data?.[0]?.embedding ?? null;
}
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

// ─────────────────────── Neighbor fetchers ───────────────────────
async function reporterProject(grantNumber: string) {
  const res = await fetch(`${REPORTER}/projects/search`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ criteria: { project_nums: [grantNumber] }, limit: 1, offset: 0 }),
  });
  return (await res.json())?.results?.[0] ?? null;
}
async function reporterSimilar(coreProjectNum: string, limit: number) {
  const res = await fetch(`${REPORTER}/projects/search`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      criteria: { advanced_text_search: { operator: "and", search_field: "all", search_text: coreProjectNum } },
      limit: limit + 1, offset: 0,
    }),
  });
  return ((await res.json())?.results ?? []).filter((p: any) => p?.project_num !== coreProjectNum).slice(0, limit);
}
async function reporterPubs(coreProjectNum: string, limit: number) {
  const res = await fetch(`${REPORTER}/publications/search`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ criteria: { core_project_nums: [coreProjectNum] }, limit, offset: 0 }),
  });
  return (await res.json())?.results ?? [];
}
async function icitePubs(pmids: string[]) {
  if (!pmids.length) return [];
  const url = `${ICITE}?pmids=${pmids.join(",")}`;
  const r = await fetch(url);
  return (await r.json())?.data ?? [];
}
function r61pair(grantNumber: string): string | null {
  if (/R61/i.test(grantNumber)) return grantNumber.replace(/R61/i, "R34");
  if (/R34/i.test(grantNumber)) return grantNumber.replace(/R34/i, "R61");
  return null;
}

async function expandNeighbors(node: NodeRef, relation: string, settings: any, onCall?: (msg: string) => Promise<void>): Promise<NodeRef[]> {
  const M = settings.targets_per_relation ?? 20;
  switch (relation) {
    case "similar_to": {
      if (node.type !== "grant") return [];
      const core = node.payload?.core_project_num ?? node.id;
      await onCall?.(`RePORTER: similar_to ${core}`);
      const sims = await reporterSimilar(core, M);
      return sims.map((p: any) => ({
        type: "grant", id: p.project_num,
        label: p.project_title,
        text: `${p.project_title ?? ""} ${p.abstract_text ?? ""}`,
        payload: p,
      }));
    }
    case "produced": {
      if (node.type !== "grant") return [];
      const core = node.payload?.core_project_num ?? node.id;
      await onCall?.(`RePORTER: publications for ${core}`);
      const pubs = await reporterPubs(core, M);
      return pubs.map((p: any) => ({
        type: "publication", id: String(p.pmid ?? ""),
        label: p.publication_title,
        text: p.publication_title ?? "",
        payload: p,
      })).filter((n: NodeRef) => n.id);
    }
    case "cites":
    case "cited_by": {
      if (node.type !== "publication") return [];
      await onCall?.(`iCite: ${relation} PMID ${node.id}`);
      const data = await icitePubs([node.id]);
      const ids: number[] = data?.[0]?.[relation === "cites" ? "references" : "cited_by"] ?? [];
      return ids.slice(0, M).map((pmid) => ({
        type: "publication", id: String(pmid),
        text: `pmid ${pmid}`,
        payload: { pmid },
      }));
    }
    case "r61_pair": {
      if (node.type !== "grant") return [];
      const pair = r61pair(node.id);
      if (!pair) return [];
      await onCall?.(`RePORTER: r61_pair ${pair}`);
      const p = await reporterProject(pair);
      if (!p) return [];
      return [{
        type: "grant", id: p.project_num,
        label: p.project_title,
        text: `${p.project_title ?? ""} ${p.abstract_text ?? ""}`,
        payload: p,
      }];
    }
    // has_investigator / co_pi_on / funded_by_org / affiliated_with / describes / uses_hardware
    // — DB-backed; fetched lazily by caller when needed. Stubbed for v1.
    default: return [];
  }
}

// ─────────────────────── Planner ───────────────────────
async function planHops(seedText: string, vocab: any[], maxHops: number, key: string): Promise<string[][]> {
  const sys = `You are a knowledge-graph planner. Given a seed grant abstract, produce a hop-wise plan to discover hardware and methods evidence used across related projects, especially R61↔R34 companion pairs and clinical-trial deployments.
You may ONLY use relations from the provided vocabulary. Output JSON {"hops": [[relation,...], ...]} with at most ${maxHops} hops. Each hop is an array of 1-3 relations to try in parallel.`;
  const user = `SEED ABSTRACT:\n${seedText.slice(0, 4000)}\n\nVOCABULARY:\n${vocab.map(v => `- ${v.name} (${v.src_node_type}→${v.dst_node_type}): ${v.description ?? ""}`).join("\n")}`;
  const res = await fetch(`${AI}/chat/completions`, {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) { console.error("planner", res.status, await res.text()); return [["similar_to"], ["produced"]]; }
  const j = await res.json();
  try {
    const parsed = JSON.parse(j?.choices?.[0]?.message?.content ?? "{}");
    const hops = parsed.hops as string[][];
    if (Array.isArray(hops) && hops.length) return hops.slice(0, maxHops);
  } catch {}
  return [["similar_to"], ["produced"]];
}

// ─────────────────────── Extractor (reused) ───────────────────────
async function pmidToUrl(pmid: string): Promise<string> {
  try {
    const r = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pmc&id=${pmid}&retmode=json`);
    const j = await r.json();
    const pmc = j?.linksets?.[0]?.linksetdbs?.[0]?.links?.[0];
    if (pmc) return `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmc}/`;
  } catch {}
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}
async function scrapeMd(url: string): Promise<string | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return null;
  const res = await fetch(FIRECRAWL, {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.markdown ?? data?.markdown ?? null;
}
function extractMethods(md: string): string | null {
  if (!md) return null;
  const lines = md.split("\n");
  const headingRe = /^(#{1,6})\s+(.+)$/;
  const methodsRe = /^(materials?\s+and\s+)?methods?\b|^experimental\s+procedures?\b|^data\s+acquisition\b/i;
  let start = -1, level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headingRe);
    if (m && methodsRe.test(m[2].trim())) { start = i; level = m[1].length; break; }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start+1; i < lines.length; i++) {
    const m = lines[i].match(headingRe);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return lines.slice(start, end).join("\n").slice(0, 12000);
}
async function extractStructured(methods: string, title: string, key: string) {
  const sys = `Extract experimental hardware and methods. Return ONLY JSON.`;
  const user = `Publication: ${title}\n\nMETHODS:\n${methods}\n\nKeys:
- device_hardware[] (free text list of specific devices/instruments)
- device_class[] (coarse buckets, ANY of: ephys_headstage, silicon_probe, miniscope, fiber_photometry, two_photon_imaging, optogenetics, iEEG_clinical, sEEG_clinical, DBS_clinical, EEG_scalp, MEG, fMRI, wearable_actigraphy, head_fixed_rig, freely_moving_rig, lickometer, treadmill, video_tracking, ultrasound_neuromod, TMS, tFUS, other)
- species[] (ANY of: mouse, rat, nhp_macaque, nhp_marmoset, human_adult, human_pediatric, human_neonate, other)
- behavior_paradigm[] (e.g. open_field, head_fixed_treadmill, lick_task, social_interaction, sleep, clinical_outcome_scale, free_behavior, decision_task)
- subject_n (integer or null)
- study_arm (one of: animal_model, clinical_translational, computational, unknown)
- stimulation_params{}, recording_params{}, analysis_metrics[]
- setting (ICU|outpatient|clinical_trial|independent_hospital|naturalistic|animal|unknown)
- irb_or_population, quote, confidence(0-1)`;
  const res = await fetch(`${AI}/chat/completions`, {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  try { return JSON.parse((await res.json())?.choices?.[0]?.message?.content ?? "{}"); }
  catch { return null; }
}

// ─────────────────────── Main ───────────────────────
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const auth = await requireAuth(req, cors);
  if (auth.error) return auth.error;

  try {
    const { seedGrantNumber } = await req.json();
    if (!seedGrantNumber) return new Response(JSON.stringify({ error: "seedGrantNumber required" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const aiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const startedAt = Date.now();
    const WALL_MS = 90_000;

    // Create a live run row so the UI can subscribe
    const { data: runRow } = await supabase.from("harvester_runs").insert({
      seed_grant: seedGrantNumber, phase: "scraping", last_message: "Loading seed",
    }).select("id").single();
    const runId = runRow?.id as string | undefined;
    const tick = async (patch: Record<string, any>) => {
      if (!runId) return;
      await supabase.from("harvester_runs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", runId);
    };
    let firecrawlCalls = 0, pubsFound = 0, evidenceRows = 0, errors = 0;

    // Load settings + vocabulary
    const { data: settings } = await supabase.from("harvester_settings").select("*").eq("id", 1).single();
    const { data: vocab } = await supabase.from("harvester_relations").select("*").eq("enabled", true);
    const vocabNames = new Set((vocab ?? []).map((v: any) => v.name));
    const beam = settings?.beam_width ?? 3;
    const maxHops = settings?.max_hops ?? 4;
    const threshold = settings?.chain_score_threshold ?? 0.15;
    const pubCap = settings?.max_publications_per_seed ?? 120;

    // Seed
    const seed = await reporterProject(seedGrantNumber);
    if (!seed) {
      await tick({ phase: "error", last_message: "seed not in NIH RePORTER", finished_at: new Date().toISOString(), errors: 1 });
      return new Response(JSON.stringify({ error: "seed not in NIH RePORTER" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const seedText = `${seed.project_title ?? ""}\n${seed.abstract_text ?? ""}`;
    const seedEmbedding = await embed(seedText, aiKey);
    if (!seedEmbedding) {
      await tick({ phase: "error", last_message: "seed embedding failed", finished_at: new Date().toISOString(), errors: 1 });
      return new Response(JSON.stringify({ error: "seed embedding failed" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Plan
    await tick({ phase: "hopping", last_message: "Planning hops", current_hop: 0 });
    const hops = await planHops(seedText, vocab ?? [], maxHops, aiKey);
    const validatedHops: string[][] = [];
    for (const hop of hops) {
      const valid: string[] = [];
      for (const r of hop) {
        if (vocabNames.has(r)) valid.push(r);
        else {
          await supabase.from("proposed_relations").insert({
            relation_name: r, seed_grant_number: seedGrantNumber,
            planner_rationale: `Planner suggested at hop ${validatedHops.length}`,
          });
        }
      }
      if (valid.length) validatedHops.push(valid.slice(0, beam));
    }

    // BFS frontier with chain-score pruning
    const seedNode: NodeRef = { type: "grant", id: seed.project_num, label: seed.project_title, text: seedText, payload: seed };
    let frontier: { node: NodeRef; path: Path; chainScore: number }[] = [
      { node: seedNode, path: [{ node: seedNode, relation_in: null, hop: 0, score: 1 }], chainScore: 1 },
    ];
    const visited = new Set<string>([`${seedNode.type}:${seedNode.id}`]);
    const seenPmids = new Set<string>();
    const { data: existing } = await supabase.from("grant_methods_evidence").select("pmid").eq("seed_grant_number", seedGrantNumber);
    (existing ?? []).forEach((r: any) => r.pmid && seenPmids.add(r.pmid));

    let pubsExtracted = 0;
    const insertedPathIds: string[] = [];

    for (let hopIdx = 0; hopIdx < validatedHops.length; hopIdx++) {
      if (Date.now() - startedAt > WALL_MS) break;
      const relations = validatedHops[hopIdx];
      await tick({ phase: "hopping", current_hop: hopIdx + 1, last_message: `Hop ${hopIdx + 1}: ${relations.join(", ")}` });
      const nextFrontier: typeof frontier = [];

      for (const f of frontier) {
        for (const rel of relations) {
          const neighbors = await expandNeighbors(f.node, rel, settings, async (msg) => {
            await tick({ phase: "hopping", current_target: msg, last_message: msg });
          });
          // Score by embedding similarity
          const scored: { n: NodeRef; s: number }[] = [];
          for (const n of neighbors) {
            const key = `${n.type}:${n.id}`;
            if (visited.has(key)) continue;
            const emb = await embed(`${rel}: ${n.label ?? ""} ${n.text ?? ""}`, aiKey);
            const s = emb ? Math.max(0, cosine(seedEmbedding, emb)) : 0.1;
            scored.push({ n, s });
          }
          scored.sort((a, b) => b.s - a.s);
          for (const { n, s } of scored.slice(0, beam)) {
            const chain = f.chainScore * s;
            if (chain < threshold) continue;
            visited.add(`${n.type}:${n.id}`);
            const newPath: Path = [...f.path, { node: n, relation_in: rel, hop: hopIdx + 1, score: s }];
            nextFrontier.push({ node: n, path: newPath, chainScore: chain });
            // Write traversal path immediately so KG Live populates (bunny hops here)
            // even before/independent of Firecrawl extraction success.
            await supabase.from("grant_methods_traversal_paths").insert({
              seed_grant_number: seedGrantNumber,
              path: newPath.map(s => ({
                node_type: s.node.type, node_id: s.node.id, label: s.node.label,
                relation_in: s.relation_in, hop: s.hop, score: s.score,
              })),
              chain_score: chain,
              planner_model: "google/gemini-3-flash-preview",
            });
          }
        }
      }

      // Process any publication nodes reached this hop
      for (const f of nextFrontier) {
        if (Date.now() - startedAt > WALL_MS) break;
        if (pubsExtracted >= pubCap) break;
        if (f.node.type !== "publication") continue;
        const pmid = f.node.id;
        if (!pmid || seenPmids.has(pmid)) continue;
        seenPmids.add(pmid);
        pubsExtracted++;
        pubsFound++;
        await tick({ phase: "extracting", current_target: `PMID ${pmid}`, pubs_found: pubsFound, last_message: f.node.label ?? `PMID ${pmid}` });

        const url = await pmidToUrl(pmid);
        const md = await scrapeMd(url);
        firecrawlCalls++;
        if (!md) continue;
        const methods = extractMethods(md);
        if (!methods || methods.length < 300) continue;
        const extract = await extractStructured(methods, f.node.label ?? "", aiKey);
        if (!extract) continue;

        // Insert traversal path first
        const { data: pathRow } = await supabase.from("grant_methods_traversal_paths").insert({
          seed_grant_number: seedGrantNumber,
          path: f.path.map(s => ({ node_type: s.node.type, node_id: s.node.id, label: s.node.label, relation_in: s.relation_in, hop: s.hop, score: s.score })),
          chain_score: f.chainScore,
          planner_model: "google/gemini-3-flash-preview",
        }).select("id").single();

        // Find source grant from path
        const sourceGrant = [...f.path].reverse().find(s => s.node.type === "grant")?.node;

        const { data: ev } = await supabase.from("grant_methods_evidence").upsert({
          seed_grant_number: seedGrantNumber,
          source_grant_number: sourceGrant?.id ?? seedGrantNumber,
          source_grant_title: sourceGrant?.label ?? null,
          source_org: sourceGrant?.payload?.organization?.org_name ?? null,
          source_org_type: sourceGrant?.payload?.organization?.org_type ?? null,
          depth: f.path.length - 1,
          match_score: f.chainScore,
          pmid, publication_title: f.node.label ?? null,
          publication_year: f.node.payload?.publication_year ?? null,
          source_url: url,
          methods_snippet: methods.slice(0, 8000),
          device_hardware: extract.device_hardware ?? [],
          device_class: Array.isArray(extract.device_class) ? extract.device_class : [],
          species: Array.isArray(extract.species) ? extract.species : [],
          behavior_paradigm: Array.isArray(extract.behavior_paradigm) ? extract.behavior_paradigm : [],
          subject_n: Number.isFinite(Number(extract.subject_n)) ? Number(extract.subject_n) : null,
          study_arm: typeof extract.study_arm === "string" ? extract.study_arm : null,
          stimulation_params: extract.stimulation_params ?? {},
          recording_params: extract.recording_params ?? {},
          analysis_metrics: extract.analysis_metrics ?? [],
          setting: extract.setting ?? null,
          irb_or_population: extract.irb_or_population ?? null,
          quote: extract.quote ?? null,
          confidence: Number(extract.confidence ?? 0),
          extracted_at: new Date().toISOString(),
          discovery_path_id: pathRow?.id ?? null,
        }, { onConflict: "seed_grant_number,source_grant_number,pmid" }).select("id").single();

        if (pathRow?.id && ev?.id) {
          await supabase.from("grant_methods_traversal_paths").update({ terminal_evidence_id: ev.id }).eq("id", pathRow.id);
          insertedPathIds.push(pathRow.id);
          evidenceRows++;
          await tick({ evidence_rows: evidenceRows, firecrawl_calls: firecrawlCalls });
        }

        // Track novel keywords for curator review
        const kwRows: { term: string; kind: string }[] = [];
        for (const t of (extract.device_class ?? [])) kwRows.push({ term: String(t).toLowerCase(), kind: "device" });
        for (const t of (extract.behavior_paradigm ?? [])) kwRows.push({ term: String(t).toLowerCase(), kind: "behavior" });
        for (const t of (extract.species ?? [])) kwRows.push({ term: String(t).toLowerCase(), kind: "species" });
        for (const t of (extract.analysis_metrics ?? [])) kwRows.push({ term: String(t).toLowerCase().slice(0, 60), kind: "analysis" });
        for (const kw of kwRows) {
          if (!kw.term) continue;
          const { data: existing } = await supabase
            .from("harvester_keywords")
            .select("id,frequency")
            .eq("term", kw.term).eq("kind", kw.kind).maybeSingle();
          if (existing) {
            await supabase.from("harvester_keywords")
              .update({ frequency: (existing.frequency ?? 0) + 1, last_seen_at: new Date().toISOString() })
              .eq("id", existing.id);
          } else {
            await supabase.from("harvester_keywords").insert({ term: kw.term, kind: kw.kind, frequency: 1 });
          }
        }
      }

      // Beam-prune next frontier overall
      nextFrontier.sort((a, b) => b.chainScore - a.chainScore);
      frontier = nextFrontier.slice(0, beam * 5);
      if (!frontier.length) break;
    }

    await tick({
      phase: "done", finished_at: new Date().toISOString(),
      pubs_found: pubsFound, evidence_rows: evidenceRows, firecrawl_calls: firecrawlCalls, errors,
      last_message: `Done: ${evidenceRows} evidence rows`,
    });

    return new Response(JSON.stringify({
      ok: true, mode: "multihop", seed: seedGrantNumber,
      hops_planned: validatedHops, publications_extracted: pubsExtracted,
      paths_recorded: insertedPathIds.length, run_id: runId,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("multihop", e);
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});