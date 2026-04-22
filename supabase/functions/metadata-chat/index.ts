import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
import { getCorsHeaders, requireAuth } from "../_shared/auth.ts";
import {
  validateToolCalls,
  sanitizeForLLM,
  scrubOutput,
  checkRateLimit,
  rateLimitResponse,
  LLM_RATE_LIMIT,
} from "../_shared/security.ts";
import { reportCriticalError } from "../_shared/alerts.ts";

// Whitelist of tool function names the LLM is allowed to call
const ALLOWED_TOOL_FUNCTIONS = new Set([
  "update_project_metadata",
  "remove_project_metadata",
]);

const METADATA_FIELDS = [
  "study_species", "use_approaches", "use_sensors", "produce_data_modality",
  "produce_data_type", "use_analysis_types", "use_analysis_method",
  "develope_software_type", "develope_hardware_type", "keywords", "website",
  "study_human",
];

const COMPLETENESS_FIELDS = [
  "study_species", "use_approaches", "use_sensors", "produce_data_modality",
  "produce_data_type", "use_analysis_types", "use_analysis_method",
  "develope_software_type", "develope_hardware_type", "keywords", "website",
];

/** Read a metadata field from project — now stored inside metadata JSONB */
function getField(project: Record<string, any>, field: string): any {
  // Top-level columns that still exist
  if (field === "study_species") return project.study_species;
  if (field === "study_human") return project.study_human;
  if (field === "keywords") return project.keywords;
  if (field === "website") return project.website;
  // Everything else lives in metadata JSONB
  const meta = project.metadata || {};
  return meta[field] ?? null;
}

function calcCompleteness(project: Record<string, any>): number {
  const filled = COMPLETENESS_FIELDS.filter(f => {
    const v = getField(project, f);
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return v !== null && v !== undefined;
  });
  return Math.round((filled.length / COMPLETENESS_FIELDS.length) * 100);
}

async function generateEmbedding(text: string, _apiKey: string): Promise<number[] | null> {
  try {
    // Lovable AI Gateway does NOT host embeddings — use OpenRouter (proxies OpenAI's model).
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) {
      reportCriticalError({
        source: "metadata-chat",
        errorCode: "MISSING_API_KEY",
        message: "OPENROUTER_API_KEY missing — embeddings disabled, RAG context will degrade",
        details: { secret_name: "OPENROUTER_API_KEY", impact: "knowledge_embeddings writes skipped" },
      });
      return null;
    }
    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (!res.ok) {
      const body = await res.text();
      reportCriticalError({
        source: "metadata-chat",
        errorCode: "EMBEDDING_API_FAILURE",
        severity: res.status >= 500 ? "critical" : "warning",
        message: `OpenRouter embedding API returned ${res.status}`,
        details: { status: res.status, body: body.slice(0, 500) },
      });
      return null;
    }
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch (e) {
    reportCriticalError({
      source: "metadata-chat",
      errorCode: "EMBEDDING_EXCEPTION",
      message: `Unexpected error generating embedding: ${e instanceof Error ? e.message : String(e)}`,
      details: { error: String(e) },
    });
    return null;
  }
}

async function searchKnowledge(supabase: any, query: string, apiKey: string, limit = 5) {
  const embedding = await generateEmbedding(query, apiKey);
  if (!embedding) return [];
  const { data } = await supabase.rpc("search_knowledge_embeddings", {
    query_embedding: `[${embedding.join(",")}]`,
    match_threshold: 0.5,
    match_count: limit,
  });
  return data || [];
}

async function writeBackInteraction(
  supabase: any, apiKey: string,
  opts: { userMessage: string; assistantResponse: string; functionName: string; toolCalls?: any[]; metadata?: any }
) {
  try {
    const content = `User asked: ${opts.userMessage}\n\nAssistant answered: ${opts.assistantResponse}`;
    const embedding = await generateEmbedding(content, apiKey);
    if (!embedding) return;
    await supabase.from("knowledge_embeddings").upsert({
      source_type: "chat_interaction",
      source_id: `${opts.functionName}_${Date.now()}`,
      title: `[${opts.functionName}] ${opts.userMessage.slice(0, 180)}`,
      content: content.slice(0, 4000),
      embedding: `[${embedding.join(",")}]`,
      metadata: {
        function: opts.functionName,
        tool_calls: opts.toolCalls || [],
        timestamp: new Date().toISOString(),
        ...opts.metadata,
      },
    }, { onConflict: "source_id" });
  } catch (e) { console.error("Embedding write-back error:", e); }
}

async function runValidationPipeline(
  changes: { field: string; values: string[] }[],
  supabaseUrl: string,
  supabaseKey: string,
): Promise<any> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/metadata-validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ changes }),
    });
    if (!res.ok) {
      console.error("Validation call failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("Validation pipeline error:", e);
    return null;
  }
}

function formatValidationReport(validation: any): string {
  if (!validation) return "";

  const statusEmoji: Record<string, string> = {
    pass: "✅",
    warning: "⚠️",
    fail: "❌",
  };

  let report = "\n\n---\n### 🔬 Validation Protocol Results\n\n";

  for (const protocol of (validation.protocols_run || [])) {
    const checks = validation.by_protocol?.[protocol] || [];
    const passes = checks.filter((c: any) => c.status === "pass").length;
    const warns = checks.filter((c: any) => c.status === "warning").length;
    const fails = checks.filter((c: any) => c.status === "fail").length;

    const protocolEmoji = fails > 0 ? "❌" : warns > 0 ? "⚠️" : "✅";
    report += `**${protocolEmoji} ${protocol}** — ${passes} passed`;
    if (warns > 0) report += `, ${warns} warnings`;
    if (fails > 0) report += `, ${fails} failed`;
    report += "\n";

    for (const check of checks) {
      report += `  ${statusEmoji[check.status]} ${check.message}\n`;
      if (check.suggestions?.length) {
        report += `    💡 Suggestions: ${check.suggestions.join(", ")}\n`;
      }
    }
    report += "\n";
  }

  const statusLabel: Record<string, string> = {
    approved: "✅ **All checks passed** — changes auto-approved.",
    needs_review: "⚠️ **Warnings detected** — changes applied but review recommended.",
    rejected: "❌ **Validation failed** — some changes were not applied. See details above.",
  };

  report += statusLabel[validation.overall_status] || "";
  return report;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require authentication
  const auth = await requireAuth(req, corsHeaders);
  if (auth.error) return auth.error;

  try {
    // Phase 6: Per-user rate limiting
    const rl = checkRateLimit(`metadata-chat:${auth.user.id}`, LLM_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(corsHeaders, rl.retryAfterMs);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) {
      reportCriticalError({
        source: "metadata-chat",
        errorCode: "MISSING_API_KEY",
        message: "LOVABLE_API_KEY not configured — AI gateway calls will fail",
        details: { secret_name: "LOVABLE_API_KEY", user_id: auth.user.id },
      });
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { messages, grant_number, mode, conversation_id } = body;
    // mode: "apply" (default, mutates projects directly) or "propose" (writes to pending_changes for review)
    const proposeMode = mode === "propose";

    // For propose mode, use a user-scoped client so RLS enforces edit permissions on pending_changes
    const userSb = proposeMode
      ? createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
          global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
        })
      : null;

    // --- Input validation ---
    if (!grant_number || typeof grant_number !== "string" || grant_number.length > 30) {
      return new Response(JSON.stringify({ error: "Valid grant_number is required (max 30 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^[A-Z0-9][A-Z0-9\-]{3,29}$/i.test(grant_number.trim())) {
      return new Response(JSON.stringify({ error: "Invalid grant_number format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "messages must be an array (1-50 items)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Phase 5: Sanitize user messages for prompt injection
    for (const msg of messages) {
      if (!msg || typeof msg !== "object" || typeof msg.content !== "string" || msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Each message.content must be a string (max 10000 chars)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.role === "user") {
        const sanitized = sanitizeForLLM(msg.content);
        if (sanitized.injectionDetected) {
          console.warn(`Prompt injection detected in metadata-chat from user ${auth.user.id}:`, sanitized.patternsMatched);
        }
        msg.content = sanitized.sanitized;
      }
    }

    // Fetch current project state + grant info + all consortium projects
    const [projectRes, grantRes, allGrantsRes, allProjectsRes, allInvRes, allGrantInvRes] = await Promise.all([
      sb.from("projects").select("*").eq("grant_number", grant_number).maybeSingle(),
      sb.from("grants").select("title, abstract, grant_number").eq("grant_number", grant_number).maybeSingle(),
      sb.from("grants").select("id, grant_number, title"),
      sb.from("projects").select("grant_number, keywords, study_species, metadata"),
      sb.from("investigators").select("id, name, role"),
      sb.from("grant_investigators").select("grant_id, investigator_id, role"),
    ]);

    const project = projectRes.data || {};
    const grant = grantRes.data;

    const currentMetadata: Record<string, any> = {};
    for (const f of METADATA_FIELDS) {
      const val = getField(project, f);
      if (val !== undefined && val !== null) {
        currentMetadata[f] = val;
      }
    }

    // Build consortium summary for cross-project queries
    const allGrants = allGrantsRes.data || [];
    const allProjects = allProjectsRes.data || [];
    const projectsByGrant = new Map(allProjects.map((p: any) => [p.grant_number, p]));

    // Build PI lookup: grant_number -> [{ name, role }]
    const allInv = allInvRes.data || [];
    const allGrantInv = allGrantInvRes.data || [];
    const invById = new Map(allInv.map((i: any) => [i.id, i]));
    const pisByGrantId = new Map<string, { name: string; role: string }[]>();
    for (const gi of allGrantInv) {
      const inv = invById.get(gi.investigator_id);
      if (!inv) continue;
      const list = pisByGrantId.get(gi.grant_id) || [];
      list.push({ name: inv.name, role: gi.role || inv.role || "investigator" });
      pisByGrantId.set(gi.grant_id, list);
    }
    const pisByGrantNumber = new Map<string, { name: string; role: string }[]>();
    for (const g of allGrants) {
      const pis = pisByGrantId.get(g.id);
      if (pis?.length) pisByGrantNumber.set(g.grant_number, pis);
    }

    const consortiumSummaries = allGrants
      .filter((g: any) => g.grant_number !== grant_number)
      .map((g: any) => {
        const p = projectsByGrant.get(g.grant_number);
        const meta = (p?.metadata) || {};
        const fields: string[] = [];
        const pis = pisByGrantNumber.get(g.grant_number) || [];
        if (pis.length) {
          const piStr = pis.map((x) => `${x.name}${x.role ? ` (${x.role})` : ""}`).join("; ");
          fields.push(`PIs: ${piStr}`);
        }
        if (p?.study_species?.length) fields.push(`Species: ${p.study_species.join(", ")}`);
        if (meta.use_approaches?.length) fields.push(`Approaches: ${meta.use_approaches.join(", ")}`);
        if (p?.keywords?.length) fields.push(`Keywords: ${p.keywords.join(", ")}`);
        if (meta.produce_data_modality?.length) fields.push(`Data: ${meta.produce_data_modality.join(", ")}`);
        if (meta.use_analysis_method?.length) fields.push(`Analysis: ${meta.use_analysis_method.join(", ")}`);
        if (meta.develope_software_type?.length) fields.push(`Software: ${meta.develope_software_type.join(", ")}`);
        if (meta.use_sensors?.length) fields.push(`Sensors: ${meta.use_sensors.join(", ")}`);
        if (meta.marr_l1_ethological_goal) fields.push(`L1: ${String(meta.marr_l1_ethological_goal).slice(0, 120)}`);
        if (meta.cross_project_synergy) fields.push(`Synergy: ${String(meta.cross_project_synergy).slice(0, 120)}`);
        return fields.length > 0 ? `- ${g.grant_number} "${g.title}": ${fields.join(" | ")}` : null;
      })
      .filter(Boolean);

    const consortiumSection = consortiumSummaries.length > 0
      ? `\n\n## Other Consortium Projects (${consortiumSummaries.length} projects):\n${consortiumSummaries.join("\n")}`
      : "";

    // RAG: search shared knowledge base
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const ragContexts = await searchKnowledge(sb, lastUserMsg, LOVABLE_API_KEY, 5);
    const ragSection = ragContexts.length > 0
      ? `\n\n## Related Knowledge Base Context:\n${ragContexts.map((c: any) => `[${c.source_type}] ${c.title}: ${c.content.slice(0, 400)}`).join("\n---\n")}`
      : "";

    const systemPrompt = `You are a metadata assistant for the BBQS (Brain Behavior Quantification and Synchronization) neuroscience consortium.

RESPONSE STYLE:
- For INFORMATIONAL questions (e.g. "what fields are missing?", "what do I need to change?"): Give a SHORT, clear, structured answer. Use bullet points. List the empty fields and briefly say what each expects. Do NOT auto-fill metadata from the abstract. Do NOT call the update tool.
- For UPDATE requests (e.g. "we study mice using calcium imaging", "add optogenetics to approaches"): Extract metadata, call the update tool, and give a concise summary of what changed.
- For CROSS-PROJECT questions (e.g. "which projects study similar species?", "who else uses calcium imaging?"): Search the consortium project list below and provide a clear summary of matching projects with their grant numbers and relevant overlapping metadata.
- Keep responses under 200 words. Be direct.

PI / INVESTIGATOR LOOKUPS:
- When the user names a person (e.g. "Inman", "Dr. Chang", "Cory Inman"), match against the "PIs:" field in the consortium list using CASE-INSENSITIVE SUBSTRING matching on ANY part of the full name (first, middle, last, surname-only, partial).
- Treat "Inman" as a match for "Cory Shields Inman", "Chang" as a match for "Steve W. C. Chang", etc.
- If multiple PIs match, list each with their grant number and project title. Never reply "no match" without first scanning every "PIs:" entry below for substring overlap.

The project you're working with:
- Grant: ${grant?.grant_number || grant_number}
- Title: ${grant?.title || "Unknown"}
- Abstract: ${grant?.abstract ? grant.abstract.slice(0, 500) : "Not available"}

Current metadata state:
${JSON.stringify(currentMetadata, null, 2)}

METADATA FIELD RULES:
- study_species: Scientific names (e.g., "Mus musculus", "Danio rerio")
- use_approaches: Experimental techniques (e.g., "optogenetics", "calcium imaging")
- use_sensors: Recording devices (e.g., "Neuropixels", "two-photon microscope")
- produce_data_modality: Data types (e.g., "spike trains", "calcium traces")
- produce_data_type: File formats produced
- use_analysis_types: Analysis categories
- use_analysis_method: Specific methods (e.g., "dimensionality reduction")
- develope_software_type: Software developed
- develope_hardware_type: Hardware developed
- keywords: General keywords
- website: Project URL
- study_human: Boolean

TOOLS:
- Use "update_project_metadata" to ADD/MERGE new values into array fields.
- Use "remove_project_metadata" to REMOVE specific values from array fields, clear a website, or reset study_human. Use this when the user says something is incorrect, wrong, shouldn't be there, or asks to delete/remove a value.
- When the user asks to remove something, ALWAYS use remove_project_metadata — never try to overwrite with update_project_metadata.
${consortiumSection}
${ragSection}`;

    const tools = [{
      type: "function" as const,
      function: {
        name: "update_project_metadata",
        description: "Add/merge new values into metadata fields for the current project. Use this to ADD data. Merges new values with existing arrays.",
        parameters: {
          type: "object",
          properties: {
            study_species: { type: "array", items: { type: "string" }, description: "Species to add" },
            use_approaches: { type: "array", items: { type: "string" }, description: "Approaches to add" },
            use_sensors: { type: "array", items: { type: "string" }, description: "Sensors to add" },
            produce_data_modality: { type: "array", items: { type: "string" }, description: "Data modalities to add" },
            produce_data_type: { type: "array", items: { type: "string" }, description: "Data types to add" },
            use_analysis_types: { type: "array", items: { type: "string" }, description: "Analysis types to add" },
            use_analysis_method: { type: "array", items: { type: "string" }, description: "Analysis methods to add" },
            develope_software_type: { type: "array", items: { type: "string" }, description: "Software types to add" },
            develope_hardware_type: { type: "array", items: { type: "string" }, description: "Hardware types to add" },
            keywords: { type: "array", items: { type: "string" }, description: "Keywords to add" },
            website: { type: "string", description: "Project website URL" },
            study_human: { type: "boolean", description: "Whether the project studies humans" },
          },
          additionalProperties: false,
        },
      },
    }, {
      type: "function" as const,
      function: {
        name: "remove_project_metadata",
        description: "Remove specific values from metadata array fields, clear the website, or reset study_human. Use this when the user says something is incorrect, wrong, or asks to delete/remove a value.",
        parameters: {
          type: "object",
          properties: {
            study_species: { type: "array", items: { type: "string" }, description: "Species to remove" },
            use_approaches: { type: "array", items: { type: "string" }, description: "Approaches to remove" },
            use_sensors: { type: "array", items: { type: "string" }, description: "Sensors to remove" },
            produce_data_modality: { type: "array", items: { type: "string" }, description: "Data modalities to remove" },
            produce_data_type: { type: "array", items: { type: "string" }, description: "Data types to remove" },
            use_analysis_types: { type: "array", items: { type: "string" }, description: "Analysis types to remove" },
            use_analysis_method: { type: "array", items: { type: "string" }, description: "Analysis methods to remove" },
            develope_software_type: { type: "array", items: { type: "string" }, description: "Software types to remove" },
            develope_hardware_type: { type: "array", items: { type: "string" }, description: "Hardware types to remove" },
            keywords: { type: "array", items: { type: "string" }, description: "Keywords to remove" },
            clear_website: { type: "boolean", description: "Set to true to clear the website field" },
            study_human: { type: "boolean", description: "New value for study_human (use false to reset)" },
          },
          additionalProperties: false,
        },
      },
    }];

    // First AI call
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      reportCriticalError({
        source: "metadata-chat",
        errorCode: "AI_GATEWAY_FAILURE",
        severity: status >= 500 ? "critical" : "warning",
        message: `Lovable AI gateway returned ${status}`,
        details: { status, body: errText.slice(0, 500), user_id: auth.user.id },
      });
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiResult = await aiResponse.json();
    const choice = aiResult.choices?.[0];
    const assistantMessage = choice?.message;

    const toolCalls = assistantMessage?.tool_calls || [];

    // Phase 5: Validate tool calls against whitelist
    if (toolCalls.length > 0) {
      const validation = validateToolCalls(toolCalls, ALLOWED_TOOL_FUNCTIONS);
      if (!validation.valid) {
        console.error(`SECURITY: LLM attempted unauthorized tool calls: ${validation.rejected.join(", ")}`);
        // Filter out unauthorized tool calls
        const filteredToolCalls = toolCalls.filter((tc: any) =>
          ALLOWED_TOOL_FUNCTIONS.has(tc?.function?.name)
        );
        toolCalls.length = 0;
        toolCalls.push(...filteredToolCalls);
      }
    }
    
    // Fields that stay as top-level columns
    const TOP_LEVEL_FIELDS = new Set(["study_species", "study_human", "keywords", "website"]);
    
    let topLevelUpdates: Record<string, any> = {};
    let metadataUpdates: Record<string, any> = { ...(project.metadata || {}) };
    const fieldsUpdated: string[] = [];
    let validationResult: any = null;
    let validationReport = "";

    for (const tc of toolCalls) {
      if (tc.function?.name === "update_project_metadata") {
        const args = JSON.parse(tc.function.arguments);

        const proposedChanges: { field: string; values: string[] }[] = [];

        for (const [key, val] of Object.entries(args)) {
          if (Array.isArray(val) && val.length > 0) {
            const existing = Array.isArray(getField(project, key)) ? getField(project, key) : [];
            const newOnly = (val as string[]).filter((v: string) => !existing.includes(v));
            if (newOnly.length > 0) {
              proposedChanges.push({ field: key, values: newOnly });
            }
            const merged = [...new Set([...existing, ...val as string[]])];
            if (TOP_LEVEL_FIELDS.has(key)) {
              topLevelUpdates[key] = merged;
            } else {
              metadataUpdates[key] = merged;
            }
            fieldsUpdated.push(key);
          } else if (key === "website" && typeof val === "string" && val.trim()) {
            topLevelUpdates[key] = val;
            fieldsUpdated.push(key);
          } else if (key === "study_human" && typeof val === "boolean") {
            topLevelUpdates[key] = val;
            fieldsUpdated.push(key);
          }
        }

        // Run validation pipeline on proposed changes
        if (proposedChanges.length > 0) {
          validationResult = await runValidationPipeline(
            proposedChanges, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
          );
          validationReport = formatValidationReport(validationResult);
        }

        // If validation rejected, remove failed fields
        if (validationResult?.overall_status === "rejected") {
          const failedFields = new Set(
            (validationResult.checks || [])
              .filter((c: any) => c.status === "fail")
              .map((c: any) => c.field)
          );
          for (const f of failedFields) {
            if (TOP_LEVEL_FIELDS.has(f)) {
              delete topLevelUpdates[f];
            } else {
              delete metadataUpdates[f];
            }
            const idx = fieldsUpdated.indexOf(f);
            if (idx >= 0) fieldsUpdated.splice(idx, 1);
          }
        }
      }

      // Handle remove_project_metadata tool
      if (tc.function?.name === "remove_project_metadata") {
        const args = JSON.parse(tc.function.arguments);

        for (const [key, val] of Object.entries(args)) {
          if (key === "clear_website" && val === true) {
            topLevelUpdates["website"] = "";
            if (!fieldsUpdated.includes("website")) fieldsUpdated.push("website");
          } else if (key === "study_human" && typeof val === "boolean") {
            topLevelUpdates[key] = val;
            if (!fieldsUpdated.includes(key)) fieldsUpdated.push(key);
          } else if (Array.isArray(val) && val.length > 0) {
            const existing = Array.isArray(getField(project, key)) ? [...getField(project, key)] : [];
            // Check metadataUpdates/topLevelUpdates in case update was called in same turn
            const current = TOP_LEVEL_FIELDS.has(key) 
              ? (Array.isArray(topLevelUpdates[key]) ? topLevelUpdates[key] : existing)
              : (Array.isArray(metadataUpdates[key]) ? metadataUpdates[key] : existing);
            const lowercaseRemovals = (val as string[]).map((v: string) => v.toLowerCase());
            const filtered = current.filter((v: string) =>
              !lowercaseRemovals.includes(v.toLowerCase())
            );
            if (TOP_LEVEL_FIELDS.has(key)) {
              topLevelUpdates[key] = filtered;
            } else {
              metadataUpdates[key] = filtered;
            }
            if (!fieldsUpdated.includes(key)) fieldsUpdated.push(key);
          }
        }
      }
    }

    // Apply DB updates if any remain
    const hasUpdates = fieldsUpdated.length > 0;
    let newCompleteness = (project as any).metadata_completeness ?? 0;

    if (hasUpdates && proposeMode && userSb) {
      // PROPOSE MODE: write to pending_changes for human review
      const { data: profile } = await sb
        .from("profiles").select("email").eq("id", auth.user.id).maybeSingle();

      const proposedRows = fieldsUpdated.map((field: string) => ({
        grant_number,
        project_id: (project as any)?.id ?? null,
        field_name: field,
        current_value: getField(project, field) ?? null,
        proposed_value: TOP_LEVEL_FIELDS.has(field) ? topLevelUpdates[field] : metadataUpdates[field],
        source: "assistant",
        proposed_by: auth.user.id,
        proposed_by_email: profile?.email || auth.user.email || null,
        rationale: typeof lastUserMsg === "string" ? lastUserMsg.slice(0, 500) : null,
        conversation_id: conversation_id || null,
        status: "pending",
      }));

      const { error: pendingErr } = await userSb.from("pending_changes").insert(proposedRows);
      if (pendingErr) {
        console.error("pending_changes insert error:", pendingErr);
        // If RLS blocks, surface a clear message
        return new Response(JSON.stringify({
          error: "Could not record proposals. You may not have edit access to this project.",
          details: pendingErr.message,
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else if (hasUpdates) {
      // APPLY MODE (legacy): mutate project directly
      const mergedProject = { ...project, ...topLevelUpdates, metadata: metadataUpdates };
      newCompleteness = calcCompleteness(mergedProject);

      const dbUpdate: Record<string, any> = {
        ...topLevelUpdates,
        metadata: metadataUpdates,
        metadata_completeness: newCompleteness,
        last_edited_by: "ai-assistant",
        updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await sb
        .from("projects")
        .update(dbUpdate)
        .eq("grant_number", grant_number);

      if (updateErr) {
        console.error("DB update error:", updateErr);
      }

      // Log to edit_history
      const chatContext = messages.slice(-3).map((m: any) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content.slice(0, 500) : '',
      }));

      const historyRows = fieldsUpdated.map((field: string) => ({
        grant_number,
        edited_by: "ai-assistant",
        field_name: field,
        old_value: getField(project, field) ?? null,
        new_value: TOP_LEVEL_FIELDS.has(field) ? topLevelUpdates[field] : metadataUpdates[field],
        chat_context: chatContext,
        validation_status: validationResult?.overall_status ?? null,
        validation_checks: validationResult?.checks?.filter((c: any) => c.field === field) ?? null,
      }));
      if (historyRows.length > 0) {
        await sb.from("edit_history").insert(historyRows);
      }

      // Per-field curation_audit_log rows so chat edits are individually undoable
      const auditRows = fieldsUpdated.map((field: string) => ({
        entity_type: "project_metadata",
        action: "update",
        field_name: field,
        grant_number,
        project_id: (project as any)?.id ?? null,
        before_value: getField(project, field) ?? null,
        after_value: TOP_LEVEL_FIELDS.has(field) ? topLevelUpdates[field] : metadataUpdates[field],
        actor_id: auth.user.id,
        actor_email: auth.user.email ?? null,
        source: "metadata_chat",
      }));
      if (auditRows.length > 0) {
        const { data: inserted, error: auditErr } = await sb
          .from("curation_audit_log")
          .insert(auditRows)
          .select("id");
        if (auditErr) {
          console.warn("curation_audit_log insert failed:", auditErr.message);
        } else if (inserted && inserted.length > 0) {
          // Stash the most recent audit id so the response can carry it
          (globalThis as any).__lastAuditId = inserted[inserted.length - 1].id;
        }
      }
    }

    // Second AI call with tool results + validation
    let finalContent = assistantMessage?.content || "";

    if (toolCalls.length > 0) {
      const toolResultContent: any = {
        success: true,
        fields_updated: fieldsUpdated,
        new_completeness: newCompleteness,
        proposed: proposeMode,
      };

      if (validationResult) {
        toolResultContent.validation = {
          overall_status: validationResult.overall_status,
          summary: validationResult.summary,
          protocols_run: validationResult.protocols_run,
        };
        toolResultContent.validation_report = validationReport;
      }

      const proposeNote = proposeMode
        ? `\n\nIMPORTANT: This is PROPOSE mode. Changes were NOT applied directly — they were submitted as suggestions for the project team to review on the Project Profile page. Phrase your response as "I've suggested updates to X, Y..." and remind the user that a project member needs to accept the changes.`
        : "";
      const followUpMessages = [
        { role: "system", content: systemPrompt + `\n\nIMPORTANT: Include the validation protocol results in your response. Here is the formatted report to include:\n${validationReport}${proposeNote}` },
        ...messages,
        assistantMessage,
        ...toolCalls.map((tc: any) => ({
          role: "tool" as const,
          tool_call_id: tc.id,
          content: JSON.stringify(toolResultContent),
        })),
      ];

      const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: followUpMessages,
        }),
      });

      if (followUp.ok) {
        const followUpResult = await followUp.json();
        finalContent = followUpResult.choices?.[0]?.message?.content || finalContent;
      }
    }

    // Write back interaction before returning so chat learning isn't dropped.
    await writeBackInteraction(sb, LOVABLE_API_KEY, {
      userMessage: lastUserMsg,
      assistantResponse: finalContent,
      functionName: "metadata-chat",
      toolCalls: fieldsUpdated.map(f => ({ field: f, value: TOP_LEVEL_FIELDS.has(f) ? topLevelUpdates[f] : metadataUpdates[f] })),
      metadata: { grant_number, fields_updated: fieldsUpdated, validation: validationResult?.overall_status },
    });

    // Phase 5: Scrub output for PII/secret leakage
    const { scrubbed: scrubbedReply, leaksDetected } = scrubOutput(finalContent);
    if (leaksDetected > 0) {
      console.error(`SECURITY: ${leaksDetected} potential data leaks scrubbed from metadata-chat output`);
    }

    return new Response(JSON.stringify({
      reply: scrubbedReply,
      fields_updated: fieldsUpdated,
      proposed: proposeMode,
      metadata_completeness: newCompleteness,
      validation: validationResult ? {
        overall_status: validationResult.overall_status,
        summary: validationResult.summary,
        protocols_run: validationResult.protocols_run,
        checks: validationResult.checks,
      } : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("metadata-chat error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    // Only alert on truly unexpected errors (already-reported cases will dedupe)
    if (!/LOVABLE_API_KEY not configured|AI gateway returned/.test(msg)) {
      reportCriticalError({
        source: "metadata-chat",
        errorCode: "UNEXPECTED_EXCEPTION",
        message: `Unhandled exception in metadata-chat: ${msg}`,
        details: { error: msg, stack: e instanceof Error ? e.stack?.slice(0, 1000) : undefined },
      });
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});