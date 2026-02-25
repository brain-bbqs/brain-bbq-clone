import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { grantTitle, grantAbstract, existingFields, similarProjects } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a metadata assistant for the BBQS (Brain Behavior Quantification and Synchronization) research consortium. Your job is to suggest structured metadata fields for NIH-funded neuroscience research projects.

Given a grant title, abstract, and information about what similar projects have filled in, suggest values for empty metadata fields.

The available fields are:
- study_species: Array of species studied (e.g., "Mouse", "Rat", "Zebrafish", "Macaque", "Human")
- use_approaches: Array of methodological approaches (e.g., "Computer Vision", "Deep Learning", "Behavioral Segmentation")
- use_sensors: Array of sensors/hardware used (e.g., "Multi-camera arrays", "EEG", "fMRI")
- produce_data_modality: Array of data types produced (e.g., "Video", "Neural recordings", "Pose data")
- use_analysis_method: Array of analysis methods (e.g., "DeepLabCut", "Dimensionality reduction")
- keywords: Array of keywords describing the project

You must respond ONLY by calling the suggest_metadata function with your suggestions. Only suggest fields that are currently empty. Be specific and grounded in the abstract text.`;

    const userPrompt = `Grant Title: ${grantTitle}

Abstract: ${grantAbstract || "No abstract available."}

Currently filled fields: ${JSON.stringify(existingFields || {})}

Similar projects' metadata for reference: ${JSON.stringify(similarProjects || [])}

Please suggest values for any empty fields based on the abstract and similar projects.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_metadata",
              description: "Suggest metadata field values for a research project.",
              parameters: {
                type: "object",
                properties: {
                  study_species: { type: "array", items: { type: "string" }, description: "Species studied" },
                  use_approaches: { type: "array", items: { type: "string" }, description: "Methodological approaches" },
                  use_sensors: { type: "array", items: { type: "string" }, description: "Sensors/hardware" },
                  produce_data_modality: { type: "array", items: { type: "string" }, description: "Data modalities produced" },
                  use_analysis_method: { type: "array", items: { type: "string" }, description: "Analysis methods" },
                  keywords: { type: "array", items: { type: "string" }, description: "Project keywords" },
                  reasoning: { type: "string", description: "Brief explanation of why these values were suggested" },
                },
                required: ["reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_metadata" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("metadata-suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
