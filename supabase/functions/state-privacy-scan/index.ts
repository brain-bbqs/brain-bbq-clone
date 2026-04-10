import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuth } from "../_shared/auth.ts";

// BBQS categories (must match frontend)
const CATEGORIES = [
  "brain_behavior",
  "consumer_health",
  "reproductive",
  "minors",
  "biometric_neuro",
];

const SYSTEM_PROMPT = `You are a legal-tech assistant helping the BBQS/EMBER neurodata consortium maintain a "state risk matrix" for health and research data.

Input you receive each time:

State: [STATE_NAME]

Source: Scraped content from national privacy law trackers (IAPP, NCSL, state legislature sites) for this state.

BBQS data-type flags of interest:

- Brain/behavioral research data (including video/audio and derived features)
- Consumer health/mental health data
- Reproductive/sexual health data
- Minors / students
- Biometric / neurological identifiers (faces, gait, voice, brain signals, geolocation at street level)

Task:

Identify which of the above BBQS data-type categories are subject to stricter-than-HIPAA or special rules in this state.

For each affected category, give:
- "statute": The specific statute/section citation (e.g. "740 ILCS 14/15(b)", "Cal. Civ. Code §1798.140(ae)"). Be as precise as possible with section numbers.
- "conflict": A concise description of what specifically conflicts with BBQS data sharing (e.g. "Prohibits transfer of biometric identifiers without written consent; BBQS pooled analysis would require per-subject release", "Requires opt-in before collecting neural data as sensitive PI").
- "note": A one-sentence summary of the rule.
- "label": A simple label BBQS can use in its matrix, chosen from:
  NO_EXTRA (no stricter rules than HIPAA/general),
  LIMITED_EXPORT (only de-identified/aggregated data or federated analysis should leave the state),
  FEDERATED_ONLY (raw data must stay in-state; only model updates/aggregates may move),
  BLOCKED (category should not be shared via BBQS).

You MUST use the suggest_risk_matrix tool to return your analysis. For each category, always include the statute, conflict, note, and label fields. If the law is unclear, use label NO_EXTRA, statute "" and say "not clearly addressed beyond HIPAA/general privacy law" in the note.`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication
  const auth = await requireAuth(req, corsHeaders);
  if (auth.error) return auth.error;

  try {
    const { state, stateName } = await req.json();
    if (!state || !stateName) {
      return new Response(
        JSON.stringify({ error: "state and stateName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[state-privacy-scan] Starting scan for ${stateName} (${state})`);

    // Step 1: Scrape multiple sources via Firecrawl search
    const searchQueries = [
      `${stateName} state health data privacy law biometric 2024 2025 site:iapp.org OR site:ncsl.org`,
      `${stateName} state consumer health privacy law neurological data`,
      `${stateName} state student data privacy minor biometric identifier law`,
    ];

    let scrapedContent = "";
    const sources: { url: string; title: string }[] = [];

    for (const query of searchQueries) {
      try {
        console.log(`[state-privacy-scan] Firecrawl search: ${query}`);
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 3,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const results = searchData.data || [];
          for (const result of results) {
            if (result.markdown) {
              // Limit each result to ~2000 chars to stay within context limits
              scrapedContent += `\n\n--- Source: ${result.url || "unknown"} ---\n`;
              scrapedContent += result.markdown.slice(0, 2000);
              if (result.url) {
                sources.push({ url: result.url, title: result.title || result.url });
              }
            }
          }
        } else {
          const errText = await searchResp.text();
          console.error(`[state-privacy-scan] Firecrawl search failed: ${searchResp.status} ${errText}`);
        }
      } catch (e) {
        console.error(`[state-privacy-scan] Firecrawl search error:`, e);
      }
    }

    if (!scrapedContent.trim()) {
      console.warn(`[state-privacy-scan] No content scraped for ${stateName}, using fallback`);
      scrapedContent = `No specific privacy law content found for ${stateName}. Classify based on general knowledge of this state's privacy landscape.`;
    }

    console.log(`[state-privacy-scan] Scraped ${scrapedContent.length} chars from ${sources.length} sources`);

    // Step 2: Send to Lovable AI for classification using tool calling
    const userPrompt = `State: ${stateName} (${state})

Scraped content from privacy law trackers:

${scrapedContent.slice(0, 12000)}

Analyze the above content and classify ${stateName}'s privacy rules for each BBQS data category.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_risk_matrix",
              description: "Return the risk classification for a US state across BBQS data categories.",
              parameters: {
                type: "object",
                properties: {
                  brain_behavior: {
                    type: "object",
                    properties: {
                      label: { type: "string", enum: ["NO_EXTRA", "LIMITED_EXPORT", "FEDERATED_ONLY", "BLOCKED"] },
                      statute: { type: "string", description: "Specific statute/section citation" },
                      conflict: { type: "string", description: "What specifically conflicts with BBQS sharing" },
                      note: { type: "string" },
                    },
                    required: ["label", "statute", "conflict", "note"],
                    additionalProperties: false,
                  },
                  consumer_health: {
                    type: "object",
                    properties: {
                      label: { type: "string", enum: ["NO_EXTRA", "LIMITED_EXPORT", "FEDERATED_ONLY", "BLOCKED"] },
                      statute: { type: "string", description: "Specific statute/section citation" },
                      conflict: { type: "string", description: "What specifically conflicts with BBQS sharing" },
                      note: { type: "string" },
                    },
                    required: ["label", "statute", "conflict", "note"],
                    additionalProperties: false,
                  },
                  reproductive: {
                    type: "object",
                    properties: {
                      label: { type: "string", enum: ["NO_EXTRA", "LIMITED_EXPORT", "FEDERATED_ONLY", "BLOCKED"] },
                      statute: { type: "string", description: "Specific statute/section citation" },
                      conflict: { type: "string", description: "What specifically conflicts with BBQS sharing" },
                      note: { type: "string" },
                    },
                    required: ["label", "statute", "conflict", "note"],
                    additionalProperties: false,
                  },
                  minors: {
                    type: "object",
                    properties: {
                      label: { type: "string", enum: ["NO_EXTRA", "LIMITED_EXPORT", "FEDERATED_ONLY", "BLOCKED"] },
                      statute: { type: "string", description: "Specific statute/section citation" },
                      conflict: { type: "string", description: "What specifically conflicts with BBQS sharing" },
                      note: { type: "string" },
                    },
                    required: ["label", "statute", "conflict", "note"],
                    additionalProperties: false,
                  },
                  biometric_neuro: {
                    type: "object",
                    properties: {
                      label: { type: "string", enum: ["NO_EXTRA", "LIMITED_EXPORT", "FEDERATED_ONLY", "BLOCKED"] },
                      statute: { type: "string", description: "Specific statute/section citation" },
                      conflict: { type: "string", description: "What specifically conflicts with BBQS sharing" },
                      note: { type: "string" },
                    },
                    required: ["label", "statute", "conflict", "note"],
                    additionalProperties: false,
                  },
                },
                required: ["brain_behavior", "consumer_health", "reproductive", "minors", "biometric_neuro"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_risk_matrix" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add Lovable AI credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResp.text();
      console.error(`[state-privacy-scan] AI gateway error: ${aiResp.status} ${errText}`);
      return new Response(
        JSON.stringify({ error: "AI classification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResp.json();
    console.log(`[state-privacy-scan] AI response received`);

    // Extract tool call result
    let categories: Record<string, { label: string; note: string }> | null = null;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        categories = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error(`[state-privacy-scan] Failed to parse tool call args:`, e);
      }
    }

    if (!categories) {
      return new Response(
        JSON.stringify({ error: "AI did not return valid classification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Upsert into DB
    const { error: dbError } = await supabase.from("state_privacy_rules").upsert(
      {
        state,
        state_name: stateName,
        last_reviewed: new Date().toISOString().split("T")[0],
        categories,
        sources,
        scan_status: "completed",
      },
      { onConflict: "state" }
    );

    if (dbError) {
      console.error(`[state-privacy-scan] DB error:`, dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[state-privacy-scan] Successfully saved ${stateName} (${state})`);

    return new Response(
      JSON.stringify({
        success: true,
        state,
        stateName,
        categories,
        sources,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[state-privacy-scan] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
