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

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  conversationId?: string;
}

// Generate embedding for a text using OpenRouter
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bbqs.dev",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Search knowledge base for relevant context
async function searchKnowledge(
  supabase: any,
  query: string,
  limit = 5
): Promise<{ source_type: string; title: string; content: string; similarity: number }[]> {
  try {
    const embedding = await generateEmbedding(query);
    
    const { data, error } = await supabase.rpc("search_knowledge_embeddings", {
      query_embedding: `[${embedding.join(",")}]`,
      match_threshold: 0.5,
      match_count: limit,
    }) as { data: any; error: any };

    if (error) {
      console.error("Knowledge search error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error searching knowledge:", err);
    return [];
  }
}

// Build system prompt with RAG context - INTERNAL DATA ONLY
function buildSystemPrompt(contexts: { source_type: string; title: string; content: string }[]): string {
  let systemPrompt = `You are Hannah, an AI research assistant for the BBQS (Brain Behavior Quantification and Synchronization) consortium.

CRITICAL INSTRUCTIONS:
- You may ONLY use information from the BBQS Knowledge Base context provided below.
- Do NOT use any external knowledge, training data, or information from the internet.
- If the context doesn't contain relevant information, say "I don't have information about that in our knowledge base."
- Always cite which source (project, publication, investigator, or workflow) you're referencing.
- Keep responses concise and focused.
- When users ask about tools, workflows, or pipelines, recommend specific tool combinations based on their species, sensors, and behaviors.
- When recommending workflows, mention which BBQS projects use similar approaches so users can collaborate.
- Format workflow recommendations as clear step-by-step pipelines.`;

  if (contexts.length > 0) {
    systemPrompt += "\n\n## BBQS Knowledge Base Context:\n";
    for (const ctx of contexts) {
      systemPrompt += `\n### [${ctx.source_type.toUpperCase()}] ${ctx.title}\n${ctx.content}\n`;
    }
  } else {
    systemPrompt += "\n\nNo relevant context found in the knowledge base for this query.";
  }

  return systemPrompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check MIT email
    if (!user.email?.toLowerCase().endsWith("@mit.edu")) {
      return new Response(JSON.stringify({ error: "Access restricted to MIT users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, conversationId }: ChatRequest = await req.json();
    const startTime = Date.now();

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const { data: newConv, error: convError } = await supabaseClient
        .from("chat_conversations")
        .insert({ user_id: user.id, title: message.slice(0, 100) })
        .select("id")
        .single();

      if (convError) throw new Error(`Conversation error: ${convError.message}`);
      convId = newConv.id;
    }

    // Get conversation history
    const { data: history } = await supabaseClient
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages: Message[] = history?.map((m) => ({ role: m.role, content: m.content })) || [];

    // Search for relevant context
    const contexts = await searchKnowledge(supabaseClient, message);
    const systemPrompt = buildSystemPrompt(contexts);

    // Save user message
    await supabaseClient.from("chat_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Call OpenRouter
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
          ...messages,
          { role: "user", content: message },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      throw new Error(`OpenRouter error: ${error}`);
    }

    const chatData = await chatResponse.json();
    const assistantContent = chatData.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
    const tokensUsed = chatData.usage?.total_tokens || 0;
    const latencyMs = Date.now() - startTime;

    // Save assistant message
    await supabaseClient.from("chat_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "assistant",
      content: assistantContent,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      model: "google/gemini-2.5-flash",
      context_sources: contexts.map((c) => ({ type: c.source_type, title: c.title })),
    });

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: convId,
        message: assistantContent,
        contextSources: contexts.map((c) => ({ type: c.source_type, title: c.title })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("NeuroMCP chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
