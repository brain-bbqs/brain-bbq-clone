import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
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
      ? `\n\nCurrent knowledge graph triples (${triples.length} total):\n${triples.map((t: any) => `${t.subject} --[${t.predicate}]--> ${t.object}`).join("\n")}`
      : "\n\nThe knowledge graph triple store is currently empty.";

    // RAG: search shared knowledge base for additional context
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const ragContexts = await searchKnowledge(supabase, lastUserMsg, LOVABLE_API_KEY, 5);
    const ragSection = ragContexts.length > 0
      ? `\n\n## Related Knowledge Base Context:\n${ragContexts.map((c: any) => `[${c.source_type}] ${c.title}: ${c.content.slice(0, 400)}`).join("\n---\n")}`
      : "";

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
${tripleContext}${ragSection}`;

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

    // For streaming responses, we collect chunks to write back the interaction
    // We tee the stream: one for the client, one to collect for embedding
    const [clientStream, collectorStream] = response.body!.tee();

    // Fire-and-forget: collect the full response and write back
    (async () => {
      try {
        const reader = collectorStream.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE chunks for content
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) fullContent += delta;
              } catch {}
            }
          }
        }
        if (fullContent && lastUserMsg) {
          await writeBackInteraction(supabase, LOVABLE_API_KEY, {
            userMessage: lastUserMsg,
            assistantResponse: fullContent,
            functionName: "computational-kg-chat",
          });
        }
      } catch (e) { console.error("Stream collection error:", e); }
    })();

    return new Response(clientStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("computational-kg-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
