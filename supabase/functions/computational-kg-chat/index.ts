import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current triples for context
    const { data: triples } = await supabase
      .from("computational_triples")
      .select("subject, predicate, object, subject_type, object_type, metadata")
      .limit(200);

    const tripleContext = triples && triples.length > 0
      ? `\n\nCurrent knowledge graph triples (${triples.length} total):\n${triples.map(t => `${t.subject} --[${t.predicate}]--> ${t.object}`).join("\n")}`
      : "\n\nThe knowledge graph triple store is currently empty.";

    const systemPrompt = `You are the BBQS Computational Landscape Knowledge Graph assistant. You help users query, understand, and update the computational knowledge graph for the Brain Behavior Quantification and Synchronization (BBQS) consortium.

The knowledge graph contains computational models organized into 6 categories:
1. Computer Vision & Continuous Kinematic Tracking
2. Unsupervised & Semi-Supervised Behavioral Segmentation  
3. Acoustic Attribution & Signal Processing
4. Neural Encoding, Decoding & Latent Variable Models
5. Generative & Embodied Agent-Based Models
6. Data Ecosystems & Foundational Infrastructure

Each model has metadata: species, goal, algorithm/method, grant number, and PIs.

When users ask to add triples, respond with a JSON tool call using the add_triples function.
When users ask questions, answer based on the knowledge graph context.
Keep answers concise and scientific.
${tripleContext}`;

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
          ...messages,
        ],
        stream: true,
        tools: [
          {
            type: "function",
            function: {
              name: "add_triples",
              description: "Add new RDF-style triples to the computational knowledge graph",
              parameters: {
                type: "object",
                properties: {
                  triples: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        subject: { type: "string" },
                        predicate: { type: "string" },
                        object: { type: "string" },
                        subject_type: { type: "string", enum: ["category", "model", "species", "grant", "pi", "method", "entity"] },
                        object_type: { type: "string", enum: ["category", "model", "species", "grant", "pi", "method", "entity"] },
                      },
                      required: ["subject", "predicate", "object"],
                    },
                  },
                },
                required: ["triples"],
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("computational-kg-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
