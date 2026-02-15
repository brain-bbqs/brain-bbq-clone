import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { Hono } from "npm:hono@^4.9.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

// Static project data
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
  if (!response.ok) throw new Error(`Embedding error: ${await response.text()}`);
  const data = await response.json();
  return data.data[0].embedding;
}

// ─── MCP Server ───────────────────────────────────────────
const mcp = new McpServer({
  name: "bbqs-mcp",
  version: "1.0.0",
});

// Tool: search_projects
mcp.tool("search_projects", {
  description: "Search BBQS consortium projects by species, PI name, or free-text query. Returns project metadata with Marr-level features (computational, algorithmic, implementation).",
  parameters: {
    type: "object" as const,
    properties: {
      species: { type: "string", description: "Filter by species (e.g. Mouse, Zebrafish, Drosophila)" },
      pi: { type: "string", description: "Filter by principal investigator name" },
      query: { type: "string", description: "Free-text search across all project fields" },
    },
  },
  handler: async (args: { species?: string; pi?: string; query?: string }) => {
    let results = [...MARR_PROJECTS];
    if (args.species) results = results.filter(p => p.species.toLowerCase() === args.species!.toLowerCase());
    if (args.pi) results = results.filter(p => p.pi.toLowerCase().includes(args.pi!.toLowerCase()));
    if (args.query) {
      const q = args.query.toLowerCase();
      results = results.filter(p =>
        p.shortName.toLowerCase().includes(q) || p.pi.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        [...p.computational, ...p.algorithmic, ...p.implementation].some(f => f.toLowerCase().includes(q))
      );
    }
    return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, projects: results }, null, 2) }] };
  },
});

// Tool: get_ontology
mcp.tool("get_ontology", {
  description: "Get the complete Marr-level feature ontology — all computational problems, algorithmic approaches, and implementation tools across the BBQS consortium.",
  parameters: { type: "object" as const, properties: {} },
  handler: async () => {
    const computational = new Set<string>();
    const algorithmic = new Set<string>();
    const implementation = new Set<string>();
    for (const p of MARR_PROJECTS) {
      p.computational.forEach(f => computational.add(f));
      p.algorithmic.forEach(f => algorithmic.add(f));
      p.implementation.forEach(f => implementation.add(f));
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify({
        marrLevels: { computational: [...computational], algorithmic: [...algorithmic], implementation: [...implementation] }
      }, null, 2) }],
    };
  },
});

// Tool: list_species
mcp.tool("list_species", {
  description: "List all species studied across the BBQS consortium with project counts and associated project names.",
  parameters: { type: "object" as const, properties: {} },
  handler: async () => {
    const map: Record<string, { species: string; projectCount: number; projects: string[] }> = {};
    for (const p of MARR_PROJECTS) {
      if (!map[p.species]) map[p.species] = { species: p.species, projectCount: 0, projects: [] };
      map[p.species].projectCount++;
      map[p.species].projects.push(p.shortName);
    }
    return { content: [{ type: "text" as const, text: JSON.stringify({ species: Object.values(map) }, null, 2) }] };
  },
});

// Tool: ask_bbqs
mcp.tool("ask_bbqs", {
  description: "Ask a natural-language question about the BBQS consortium. Uses retrieval-augmented generation over the knowledge base including projects, publications, investigators, and tools.",
  parameters: {
    type: "object" as const,
    properties: {
      question: { type: "string", description: "The question to ask about BBQS" },
    },
    required: ["question"],
  },
  handler: async (args: { question: string }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const embedding = await generateEmbedding(args.question);
    const { data: contexts } = await supabase.rpc("search_knowledge_embeddings", {
      query_embedding: `[${embedding.join(",")}]`,
      match_threshold: 0.5,
      match_count: 5,
    });

    let systemPrompt = `You are a helpful assistant for the BBQS (Brain Behavior Quantification and Synchronization) consortium. Answer using ONLY the provided context. Be concise and factual.`;
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
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: args.question }],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!chatResponse.ok) throw new Error(`LLM error: ${await chatResponse.text()}`);
    const chatData = await chatResponse.json();
    const answer = chatData.choices[0]?.message?.content || "Unable to generate a response.";
    const sources = (contexts || []).map((c: any) => `[${c.source_type}] ${c.title}`);

    return {
      content: [{ type: "text" as const, text: `${answer}\n\nSources: ${sources.join(", ") || "none"}` }],
    };
  },
});

// ─── HTTP Transport ───────────────────────────────────────
const transport = new StreamableHttpTransport();

const app = new Hono();
const mcpApp = new Hono();

mcpApp.get("/", (c) => {
  return c.json({
    name: "bbqs-mcp",
    version: "1.0.0",
    description: "BBQS Consortium MCP Server — query projects, species, ontology, and ask questions via RAG.",
    tools: ["search_projects", "get_ontology", "list_species", "ask_bbqs"],
  });
});

mcpApp.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcp);
});

app.route("/bbqs-mcp", mcpApp);

Deno.serve(app.fetch);
