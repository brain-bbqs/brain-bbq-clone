import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

function calcCompleteness(project: Record<string, any>): number {
  const filled = COMPLETENESS_FIELDS.filter(f => {
    const v = project[f];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return v !== null && v !== undefined;
  });
  return Math.round((filled.length / COMPLETENESS_FIELDS.length) * 100);
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch { return null; }
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

/** Call the metadata-validate function internally */
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

/** Format validation results into a markdown section for the AI to include */
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { messages, grant_number } = await req.json();

    if (!grant_number) {
      return new Response(JSON.stringify({ error: "grant_number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current project state + grant info
    const [projectRes, grantRes] = await Promise.all([
      sb.from("projects").select("*").eq("grant_number", grant_number).maybeSingle(),
      sb.from("grants").select("title, abstract, grant_number").eq("grant_number", grant_number).maybeSingle(),
    ]);

    const project = projectRes.data || {};
    const grant = grantRes.data;

    const currentMetadata: Record<string, any> = {};
    for (const f of METADATA_FIELDS) {
      if ((project as any)[f] !== undefined && (project as any)[f] !== null) {
        currentMetadata[f] = (project as any)[f];
      }
    }

    // RAG: search shared knowledge base
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const ragContexts = await searchKnowledge(sb, lastUserMsg, LOVABLE_API_KEY, 5);
    const ragSection = ragContexts.length > 0
      ? `\n\n## Related Knowledge Base Context:\n${ragContexts.map((c: any) => `[${c.source_type}] ${c.title}: ${c.content.slice(0, 400)}`).join("\n---\n")}`
      : "";

    const systemPrompt = `You are a metadata assistant for the BBQS (Brain Behavior Quantification and Synchronization) neuroscience consortium. Scientists will describe their experiments, methods, species, tools, and data in natural language. Your job is to:

1. Understand what they're describing
2. Extract structured metadata from their description
3. Use the update_project_metadata tool to save the extracted data
4. The system will automatically run validation protocols (BIDS, NWB, HED) on your proposed changes
5. Include the validation results in your response so the user can see what passed/failed

The project you're working with:
- Grant: ${grant?.grant_number || grant_number}
- Title: ${grant?.title || "Unknown"}
- Abstract: ${grant?.abstract ? grant.abstract.slice(0, 500) : "Not available"}

Current metadata state:
${JSON.stringify(currentMetadata, null, 2)}

IMPORTANT RULES:
- When the scientist mentions species, add them to study_species (e.g., "mice" → "Mus musculus", "rats" → "Rattus norvegicus", "zebrafish" → "Danio rerio")
- When they mention techniques/methods, categorize into the right fields:
  - Experimental approaches → use_approaches (e.g., "optogenetics", "calcium imaging", "electrophysiology")
  - Recording devices → use_sensors (e.g., "Neuropixels", "two-photon microscope", "EEG")
  - Data types produced → produce_data_modality (e.g., "spike trains", "calcium traces", "behavioral video")
  - Analysis methods → use_analysis_method (e.g., "dimensionality reduction", "decoding", "clustering")
  - Software they develop → develope_software_type
  - Hardware they develop → develope_hardware_type
- MERGE new values with existing arrays — never overwrite existing values
- Use canonical/standardized names when possible
- Be conversational and helpful — scientists should feel like they're talking to a knowledgeable colleague
- After updating, include the validation protocol results and summarize what changed
${ragSection}`;

    const tools = [{
      type: "function" as const,
      function: {
        name: "update_project_metadata",
        description: "Update structured metadata fields for the current project. Merges new values with existing arrays.",
        parameters: {
          type: "object",
          properties: {
            study_species: { type: "array", items: { type: "string" }, description: "Species studied (use scientific names)" },
            use_approaches: { type: "array", items: { type: "string" }, description: "Experimental approaches used" },
            use_sensors: { type: "array", items: { type: "string" }, description: "Sensors/recording devices used" },
            produce_data_modality: { type: "array", items: { type: "string" }, description: "Types of data produced" },
            produce_data_type: { type: "array", items: { type: "string" }, description: "Data file types produced" },
            use_analysis_types: { type: "array", items: { type: "string" }, description: "Types of analysis performed" },
            use_analysis_method: { type: "array", items: { type: "string" }, description: "Specific analysis methods" },
            develope_software_type: { type: "array", items: { type: "string" }, description: "Software being developed" },
            develope_hardware_type: { type: "array", items: { type: "string" }, description: "Hardware being developed" },
            keywords: { type: "array", items: { type: "string" }, description: "General keywords for the project" },
            website: { type: "string", description: "Project website URL" },
            study_human: { type: "boolean", description: "Whether the project studies humans" },
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
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiResult = await aiResponse.json();
    const choice = aiResult.choices?.[0];
    const assistantMessage = choice?.message;

    const toolCalls = assistantMessage?.tool_calls || [];
    let dbUpdates: Record<string, any> = {};
    const fieldsUpdated: string[] = [];
    let validationResult: any = null;
    let validationReport = "";

    for (const tc of toolCalls) {
      if (tc.function?.name === "update_project_metadata") {
        const args = JSON.parse(tc.function.arguments);

        // Build proposed changes for validation
        const proposedChanges: { field: string; values: string[] }[] = [];

        for (const [key, val] of Object.entries(args)) {
          if (Array.isArray(val) && val.length > 0) {
            const existing = Array.isArray((project as any)[key]) ? (project as any)[key] : [];
            const newOnly = (val as string[]).filter((v: string) => !existing.includes(v));
            if (newOnly.length > 0) {
              proposedChanges.push({ field: key, values: newOnly });
            }
            const merged = [...new Set([...existing, ...val as string[]])];
            dbUpdates[key] = merged;
            fieldsUpdated.push(key);
          } else if (key === "website" && typeof val === "string" && val.trim()) {
            dbUpdates[key] = val;
            fieldsUpdated.push(key);
          } else if (key === "study_human" && typeof val === "boolean") {
            dbUpdates[key] = val;
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
            delete dbUpdates[f];
            const idx = fieldsUpdated.indexOf(f);
            if (idx >= 0) fieldsUpdated.splice(idx, 1);
          }
        }
      }
    }

    // Apply DB updates if any remain
    if (Object.keys(dbUpdates).length > 0) {
      const merged = { ...(project || {}), ...dbUpdates };
      dbUpdates.metadata_completeness = calcCompleteness(merged);
      dbUpdates.last_edited_by = "ai-assistant";
      dbUpdates.updated_at = new Date().toISOString();

      const { error: updateErr } = await sb
        .from("projects")
        .update(dbUpdates)
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
        old_value: (project as any)[field] ?? null,
        new_value: dbUpdates[field],
        chat_context: chatContext,
      }));
      if (historyRows.length > 0) {
        await sb.from("edit_history").insert(historyRows);
      }
    }

    // Second AI call with tool results + validation
    let finalContent = assistantMessage?.content || "";

    if (toolCalls.length > 0) {
      const toolResultContent: any = {
        success: true,
        fields_updated: fieldsUpdated,
        new_completeness: dbUpdates.metadata_completeness,
      };

      if (validationResult) {
        toolResultContent.validation = {
          overall_status: validationResult.overall_status,
          summary: validationResult.summary,
          protocols_run: validationResult.protocols_run,
        };
        toolResultContent.validation_report = validationReport;
      }

      const followUpMessages = [
        { role: "system", content: systemPrompt + `\n\nIMPORTANT: Include the validation protocol results in your response. Here is the formatted report to include:\n${validationReport}` },
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

    // Write back interaction
    writeBackInteraction(sb, LOVABLE_API_KEY, {
      userMessage: lastUserMsg,
      assistantResponse: finalContent,
      functionName: "metadata-chat",
      toolCalls: fieldsUpdated.map(f => ({ field: f, value: dbUpdates[f] })),
      metadata: { grant_number, fields_updated: fieldsUpdated, validation: validationResult?.overall_status },
    });

    return new Response(JSON.stringify({
      reply: finalContent,
      fields_updated: fieldsUpdated,
      metadata_completeness: dbUpdates.metadata_completeness ?? (project as any).metadata_completeness ?? 0,
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
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
