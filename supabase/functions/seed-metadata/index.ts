import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get projects with low completeness
    const { data: projects, error: pErr } = await sb.from("projects").select("*").lt("metadata_completeness", 50);
    if (pErr) throw pErr;

    // Get grants for abstracts
    const grantNumbers = (projects || []).map(p => p.grant_number);
    const { data: grants } = await sb.from("grants").select("grant_number, title, abstract").in("grant_number", grantNumbers);
    const grantMap = new Map((grants || []).map(g => [g.grant_number, g]));

    // Get all projects for "similar projects" context
    const { data: allProjects } = await sb.from("projects").select("grant_number, study_species, use_approaches, use_analysis_method, keywords").gte("metadata_completeness", 50);

    const results: { grant_number: string; status: string; fields_updated?: number }[] = [];

    for (const project of (projects || [])) {
      const grant = grantMap.get(project.grant_number);
      if (!grant?.abstract) {
        results.push({ grant_number: project.grant_number, status: "skipped_no_abstract" });
        continue;
      }

      // Build existing fields
      const existingFields: Record<string, any> = {};
      const arrayFields = ["study_species", "use_approaches", "use_sensors", "produce_data_modality", "use_analysis_method", "keywords"];
      for (const f of arrayFields) {
        if (project[f]?.length > 0) existingFields[f] = project[f];
      }

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are a metadata assistant for BBQS neuroscience projects. Suggest metadata values for empty fields based on the grant abstract. Only suggest fields that are currently empty. Be specific and grounded in the text.`,
              },
              {
                role: "user",
                content: `Title: ${grant.title}\nAbstract: ${grant.abstract}\nExisting: ${JSON.stringify(existingFields)}\nSimilar projects: ${JSON.stringify((allProjects || []).slice(0, 3).map(p => ({ species: p.study_species, approaches: p.use_approaches })))}`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "suggest_metadata",
                description: "Suggest metadata values",
                parameters: {
                  type: "object",
                  properties: {
                    study_species: { type: "array", items: { type: "string" } },
                    use_approaches: { type: "array", items: { type: "string" } },
                    use_sensors: { type: "array", items: { type: "string" } },
                    produce_data_modality: { type: "array", items: { type: "string" } },
                    use_analysis_method: { type: "array", items: { type: "string" } },
                    keywords: { type: "array", items: { type: "string" } },
                  },
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "suggest_metadata" } },
          }),
        });

        if (!response.ok) {
          results.push({ grant_number: project.grant_number, status: `ai_error_${response.status}` });
          continue;
        }

        const aiResult = await response.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          results.push({ grant_number: project.grant_number, status: "no_tool_call" });
          continue;
        }

        const suggestions = JSON.parse(toolCall.function.arguments);
        const updates: Record<string, any> = {};
        let fieldsUpdated = 0;

        for (const [key, val] of Object.entries(suggestions)) {
          if (Array.isArray(val) && val.length > 0 && (!project[key] || project[key].length === 0)) {
            updates[key] = val;
            fieldsUpdated++;
          }
        }

        if (fieldsUpdated > 0) {
          // Recalculate completeness
          const merged = { ...project, ...updates };
          const checkFields = ["study_species", "use_approaches", "use_sensors", "produce_data_modality", "produce_data_type", "use_analysis_types", "use_analysis_method", "develope_software_type", "develope_hardware_type", "keywords", "website"];
          const filled = checkFields.filter(f => {
            const v = merged[f];
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === "string") return v.trim().length > 0;
            return false;
          });
          updates.metadata_completeness = Math.round((filled.length / checkFields.length) * 100);
          updates.last_edited_by = "ai-seed";

          await sb.from("projects").update(updates).eq("grant_number", project.grant_number);
        }

        results.push({ grant_number: project.grant_number, status: "success", fields_updated: fieldsUpdated });
      } catch (e) {
        results.push({ grant_number: project.grant_number, status: `error: ${e.message}` });
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-metadata error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
