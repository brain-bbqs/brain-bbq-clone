import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { load as yamlLoad } from "https://esm.sh/js-yaml@4.1.0";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  PUBLIC_API_RATE_LIMIT,
} from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

// ─── Dynamic YAML loading with cache ─────────────────────
const YAML_URL = "https://bbqs.dev/bbqs_marr.yaml";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface ParsedProject {
  id: string;
  shortName: string;
  pi: string;
  species: string;
  institution: string;
  title: string;
  computational: string[];
  algorithmic: string[];
  implementation: string[];
  dataModalities: string[];
  experimentalApproaches: string[];
  keywords: string[];
  crossProjectSynergy: string;
}

let cachedProjects: ParsedProject[] | null = null;
let cacheTimestamp = 0;

function splitField(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(/[;.]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
}

function parseShortName(p: any): string {
  const leads = p.project_leads || [];
  const firstLead = leads[0] || "";
  const lastName = firstLead.split(",")[0]?.trim() || "Unknown";
  const title = p.project_title || "";
  const species = p.target_species_domain || p.species || "";

  if (title.toLowerCase().includes("bard") || title.toLowerCase().includes("bbqs ai")) return "BARD.CC";
  if (title.toLowerCase().includes("ember") || title.toLowerCase().includes("ecosystem for multi-modal")) return "EMBER";

  const keywords = [species, ...(p.keywords || []).slice(0, 1)].filter(Boolean);
  const descriptor = keywords[0] || title.split(/\s+/).slice(0, 2).join(" ");
  return `${lastName} – ${descriptor}`;
}

function parseProject(p: any): ParsedProject {
  const leads = p.project_leads || [];
  const firstLead = leads[0] || "";
  const piName = firstLead.includes(",")
    ? firstLead.split(",").map((s: string) => s.trim()).reverse().join(" ")
    : firstLead;

  const tsd = p.target_species_domain || "";
  const rawSpecies = p.species || tsd;
  const speciesList: string[] = Array.isArray(rawSpecies)
    ? rawSpecies.flatMap((s: string) => s.split(/\s*\/\s*/)).filter(Boolean)
    : (typeof rawSpecies === "string" ? rawSpecies.split(/\s*\/\s*/).filter(Boolean) : []);

  return {
    id: p.grant_number || "",
    shortName: parseShortName(p),
    pi: piName,
    species: speciesList[0] || "",
    institution: p.institution || "",
    title: p.project_title || "",
    computational: splitField(p.marr_l1_ethological_goal),
    algorithmic: splitField(p.marr_l2_algorithmic_function),
    implementation: splitField(p.marr_l3_implementational_hardware),
    dataModalities: p.data_modalities || [],
    experimentalApproaches: p.experimental_approaches || [],
    keywords: p.keywords || [],
    crossProjectSynergy: p.cross_project_synergy || "",
  };
}

async function getProjects(): Promise<ParsedProject[]> {
  const now = Date.now();
  if (cachedProjects && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProjects;
  }

  try {
    const response = await fetch(YAML_URL);
    if (!response.ok) {
      console.error(`Failed to fetch YAML: ${response.status}`);
      return cachedProjects || [];
    }
    const text = await response.text();
    const parsed = yamlLoad(text) as { projects: any[] };
    const rawProjects = parsed?.projects || [];
    cachedProjects = rawProjects.map((p: any) => parseProject(p));
    cacheTimestamp = now;
    console.log(`Loaded ${cachedProjects.length} projects from YAML`);
    return cachedProjects;
  } catch (err) {
    console.error("YAML fetch error:", err);
    return cachedProjects || [];
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bbqs.dev",
    },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Phase 6: Per-IP rate limiting for public API
  const clientIP = getClientIP(req);
  const rl = checkRateLimit(`bbqs-api:${clientIP}`, PUBLIC_API_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(corsHeaders, rl.retryAfterMs);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/bbqs-api\/?/, "").replace(/\/$/, "");

  try {
    const projects = await getProjects();

    // ─── GET /projects ───────────────────────────────────────
    if (req.method === "GET" && (path === "projects" || path === "")) {
      const species = url.searchParams.get("species");
      const pi = url.searchParams.get("pi");
      const search = url.searchParams.get("q");

      let results = [...projects];

      if (species) {
        results = results.filter((p) => p.species.toLowerCase() === species.toLowerCase());
      }
      if (pi) {
        results = results.filter((p) => p.pi.toLowerCase().includes(pi.toLowerCase()));
      }
      if (search) {
        const q = search.toLowerCase();
        results = results.filter((p) =>
          p.shortName.toLowerCase().includes(q) ||
          p.pi.toLowerCase().includes(q) ||
          p.species.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.computational.some((f) => f.toLowerCase().includes(q)) ||
          p.algorithmic.some((f) => f.toLowerCase().includes(q)) ||
          p.implementation.some((f) => f.toLowerCase().includes(q)) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
        );
      }

      return jsonResponse({
        count: results.length,
        projects: results,
      });
    }

    // ─── GET /projects/:id ───────────────────────────────────
    if (req.method === "GET" && path.startsWith("projects/")) {
      const projectId = path.replace("projects/", "");
      const project = projects.find((p) => p.id === projectId);
      if (!project) return jsonResponse({ error: "Project not found" }, 404);
      return jsonResponse(project);
    }

    // ─── GET /species ────────────────────────────────────────
    if (req.method === "GET" && path === "species") {
      const speciesMap: Record<string, { species: string; projectCount: number; projects: string[] }> = {};
      for (const p of projects) {
        if (!p.species) continue;
        if (!speciesMap[p.species]) {
          speciesMap[p.species] = { species: p.species, projectCount: 0, projects: [] };
        }
        speciesMap[p.species].projectCount++;
        speciesMap[p.species].projects.push(p.shortName);
      }
      return jsonResponse({ species: Object.values(speciesMap) });
    }

    // ─── GET /ontology ───────────────────────────────────────
    if (req.method === "GET" && path === "ontology") {
      const computational = new Set<string>();
      const algorithmic = new Set<string>();
      const implementation = new Set<string>();
      for (const p of projects) {
        p.computational.forEach((f) => computational.add(f));
        p.algorithmic.forEach((f) => algorithmic.add(f));
        p.implementation.forEach((f) => implementation.add(f));
      }
      return jsonResponse({
        marrLevels: {
          computational: [...computational],
          algorithmic: [...algorithmic],
          implementation: [...implementation],
        },
      });
    }

    // ─── POST /ask ───────────────────────────────────────────
    if (req.method === "POST" && path === "ask") {
      // Require authenticated consortium member
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return jsonResponse({ error: "Authentication required. Please sign in with Globus." }, 401);
      }

      const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
      if (claimsError || !claimsData?.user) {
        return jsonResponse({ error: "Invalid or expired session. Please sign in again." }, 401);
      }

      const body = await req.json();
      const question = body.question || body.message;
      if (!question || typeof question !== "string") {
        return jsonResponse({ error: "Missing 'question' field in request body" }, 400);
      }
      if (question.length > 2000) {
        return jsonResponse({ error: "Question too long (max 2000 characters)" }, 400);
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // RAG: search knowledge base
      const embedding = await generateEmbedding(question);
      const { data: contexts } = await supabase.rpc("search_knowledge_embeddings", {
        query_embedding: `[${embedding.join(",")}]`,
        match_threshold: 0.5,
        match_count: 5,
      });

      // Build project context from live YAML data
      const projectContext = projects.map((p) =>
        `- ${p.shortName} (${p.id}): PI: ${p.pi}, Species: ${p.species}, Institution: ${p.institution}, Title: ${p.title}, Computational: ${p.computational.join("; ")}, Algorithmic: ${p.algorithmic.join("; ")}, Implementation: ${p.implementation.join("; ")}, Keywords: ${p.keywords.join(", ")}, Data Modalities: ${p.dataModalities.join(", ")}, Experimental Approaches: ${p.experimentalApproaches.join(", ")}`
      ).join("\n");

      let systemPrompt = `You are a helpful assistant for the BBQS (Brain Behavior Quantification and Synchronization) consortium. Answer questions using the provided project data and context. Be concise and factual. If the context doesn't cover the question, say so.

## BBQS Consortium Projects (${projects.length} total)
${projectContext}`;

      if (contexts && contexts.length > 0) {
        systemPrompt += "\n\n## Additional Knowledge Base Context:\n";
        for (const ctx of contexts) {
          systemPrompt += `\n### [${ctx.source_type}] ${ctx.title}\n${ctx.content}\n`;
        }
      }

      const chatResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://bbqs.dev",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (!chatResponse.ok) {
        const error = await chatResponse.text();
        throw new Error(`LLM error: ${error}`);
      }

      const chatData = await chatResponse.json();
      const answer = chatData.choices[0]?.message?.content || "Unable to generate a response.";

      return jsonResponse({
        answer,
        sources: (contexts || []).map((c: any) => ({ type: c.source_type, title: c.title })),
        model: "google/gemini-2.5-flash",
      });
    }

    // ─── 404 ─────────────────────────────────────────────────
    return jsonResponse({
      error: "Not found",
      availableEndpoints: [
        "GET  /projects",
        "GET  /projects/:id",
        "GET  /species",
        "GET  /ontology",
        "POST /ask",
      ],
    }, 404);

  } catch (error) {
    console.error("BBQS API error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500
    );
  }
});
