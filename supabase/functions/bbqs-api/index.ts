import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

// Static MARR project data (mirrored from frontend for API access)
const MARR_PROJECTS = [
  { id: "R34DA059510", shortName: "Dyer – Cichlid Arena", pi: "Eva Dyer", species: "Cichlid", computational: ["Multi-animal social behavior quantification", "Species differentiation", "Hierarchical social structure"], algorithmic: ["Pose estimation", "Behavior classification", "Social network analysis"], implementation: ["DeepLabCut", "SLEAP", "Custom arena tracking"] },
  { id: "U19NS123714", shortName: "Bhatt – Zebrafish Navigation", pi: "Dhruv Bhatt", species: "Zebrafish", computational: ["Whole-brain neural dynamics during behavior", "Sensorimotor integration", "Navigation circuits"], algorithmic: ["Calcium imaging analysis", "Behavioral segmentation", "Neural decoding"], implementation: ["Suite2p", "DeepLabCut", "Custom VR systems"] },
  { id: "U19NS104649", shortName: "Bhatt – Zebrafish Locomotion", pi: "Dhruv Bhatt", species: "Zebrafish", computational: ["Locomotor pattern generation", "Spinal cord circuits", "Motor control"], algorithmic: ["High-speed video analysis", "Kinematic modeling", "Electrophysiology analysis"], implementation: ["Custom tracking software", "MATLAB", "Python"] },
  { id: "R01MH129046", shortName: "Datta – Mouse Behavior", pi: "Sandeep Robert Datta", species: "Mouse", computational: ["Behavioral syllable discovery", "Spontaneous behavior quantification", "Action sequence analysis"], algorithmic: ["Variational autoencoders", "Hidden Markov models", "Dimensionality reduction"], implementation: ["MoSeq", "keypoint-MoSeq", "Python"] },
  { id: "U01NS121764", shortName: "Ölveczky – Motor Learning", pi: "Bence Ölveczky", species: "Mouse", computational: ["Skilled motor learning", "Basal ganglia function", "Motor sequence optimization"], algorithmic: ["3D pose estimation", "Reinforcement learning models", "Neural trajectory analysis"], implementation: ["DANNCE", "Custom rigs", "MATLAB"] },
  { id: "RF1MH132649", shortName: "Murthy – Fly Courtship", pi: "Mala Murthy", species: "Drosophila", computational: ["Courtship behavior quantification", "Multi-modal sensory integration", "Song pattern analysis"], algorithmic: ["Audio segmentation", "Pose tracking", "Behavioral state classification"], implementation: ["SLEAP", "DeepEthogram", "FlySongSegmenter"] },
  { id: "R01NS130789", shortName: "Pereira – Fly Social", pi: "Talmo Pereira", species: "Drosophila", computational: ["Multi-animal social behavior", "Aggression quantification", "Group dynamics"], algorithmic: ["Multi-animal pose estimation", "Identity tracking", "Action recognition"], implementation: ["SLEAP", "Social LEAP", "Python"] },
  { id: "U19NS123716", shortName: "Bhatt – Lamprey Locomotion", pi: "Dhruv Bhatt", species: "Lamprey", computational: ["Locomotor rhythm generation", "Spinal cord pattern generators", "Undulatory locomotion"], algorithmic: ["Kinematic analysis", "Frequency decomposition", "Electrophysiology"], implementation: ["Custom tracking", "MATLAB", "Python"] },
  { id: "R01DA055550", shortName: "Wiltschko – Pharmacology", pi: "Alex Wiltschko", species: "Mouse", computational: ["Drug effect quantification", "Behavioral phenotyping", "Dose-response modeling"], algorithmic: ["Behavioral syllables", "Clustering", "Statistical testing"], implementation: ["MoSeq", "Python", "Custom pipelines"] },
  { id: "U19NS123715", shortName: "Engert – Zebrafish Vision", pi: "Florian Engert", species: "Zebrafish", computational: ["Visual processing", "Prey capture", "Optomotor response"], algorithmic: ["Calcium imaging", "Visual stimulus modeling", "Behavioral classification"], implementation: ["Suite2p", "Stytra", "Python"] },
  { id: "R01NS130790", shortName: "Mathis – Primate Reaching", pi: "Mackenzie Mathis", species: "Primate", computational: ["Reaching and grasping", "Motor cortex dynamics", "Dexterous manipulation"], algorithmic: ["Markerless pose estimation", "Neural decoding", "Transfer learning"], implementation: ["DeepLabCut", "Anipose", "Python"] },
];

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

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/bbqs-api\/?/, "").replace(/\/$/, "");

  try {
    // ─── GET /projects ───────────────────────────────────────
    if (req.method === "GET" && (path === "projects" || path === "")) {
      const species = url.searchParams.get("species");
      const pi = url.searchParams.get("pi");
      const search = url.searchParams.get("q");

      let results = [...MARR_PROJECTS];

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
          p.computational.some((f) => f.toLowerCase().includes(q)) ||
          p.algorithmic.some((f) => f.toLowerCase().includes(q)) ||
          p.implementation.some((f) => f.toLowerCase().includes(q))
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
      const project = MARR_PROJECTS.find((p) => p.id === projectId);
      if (!project) return jsonResponse({ error: "Project not found" }, 404);
      return jsonResponse(project);
    }

    // ─── GET /species ────────────────────────────────────────
    if (req.method === "GET" && path === "species") {
      const speciesMap: Record<string, { species: string; projectCount: number; projects: string[] }> = {};
      for (const p of MARR_PROJECTS) {
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
      for (const p of MARR_PROJECTS) {
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

      let systemPrompt = `You are a helpful assistant for the BBQS (Brain Behavior Quantification and Synchronization) consortium API. Answer questions using ONLY the provided context. Be concise and factual. If the context doesn't cover the question, say so.`;

      if (contexts && contexts.length > 0) {
        systemPrompt += "\n\n## Context:\n";
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
