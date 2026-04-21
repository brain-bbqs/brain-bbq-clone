import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sanitizeForLLM,
  scrubOutput,
  checkRateLimit,
  rateLimitResponse,
  LLM_RATE_LIMIT,
} from "../_shared/security.ts";

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

async function generateEmbedding(text: string): Promise<number[]> {
  // OpenRouter proxies OpenAI's embedding model — single key for chat + embeddings.
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
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

async function searchKnowledge(
  supabase: any, query: string, limit = 5
): Promise<{ source_type: string; title: string; content: string; similarity: number }[]> {
  try {
    const embedding = await generateEmbedding(query);
    const { data, error } = await supabase.rpc("search_knowledge_embeddings", {
      query_embedding: `[${embedding.join(",")}]`,
      match_threshold: 0.5,
      match_count: limit,
    });
    if (error) { console.error("Knowledge search error:", error); return []; }
    return data || [];
  } catch (err) { console.error("Error searching knowledge:", err); return []; }
}

async function writeBackInteraction(
  supabase: any,
  opts: { userMessage: string; assistantResponse: string; contextSources: any[] }
) {
  try {
    const content = `User asked: ${opts.userMessage}\n\nAssistant answered: ${opts.assistantResponse}`;
    const embedding = await generateEmbedding(content.slice(0, 8000));
    await supabase.from("knowledge_embeddings").upsert({
      source_type: "chat_interaction",
      source_id: `neuromcp-chat_${Date.now()}`,
      title: `[neuromcp-chat] ${opts.userMessage.slice(0, 180)}`,
      content: content.slice(0, 4000),
      embedding: `[${embedding.join(",")}]`,
      metadata: {
        function: "neuromcp-chat",
        context_sources: opts.contextSources,
        timestamp: new Date().toISOString(),
      },
    }, { onConflict: "source_id" });
  } catch (e) { console.error("Embedding write-back error:", e); }
}

function buildSystemPrompt(contexts: { source_type: string; title: string; content: string }[]): string {
  let systemPrompt = `You are Hannah, an AI research assistant for the BBQS (Brain Behavior Quantification and Synchronization) consortium.

CRITICAL INSTRUCTIONS:
- Your primary source of information is the BBQS Knowledge Base context provided below.
- When the context contains relevant projects, tools, investigators, or workflows, USE them to construct a helpful, detailed answer — even if the match is not exact.
- Synthesize and reason across multiple context sources to provide comprehensive recommendations.
- When a user asks about a species, sensor, or behavior not explicitly covered, look for the closest analogues in the context and explain how those tools/projects could be adapted or referenced.
- Only say "I don't have information about that" if the context is completely empty or entirely unrelated to the query.
- Always cite which source (project, publication, investigator, or workflow) you're referencing.
- When users ask about tools, workflows, or pipelines, recommend specific tool combinations based on their species, sensors, and behaviors.
- When recommending workflows, mention which BBQS projects use similar approaches so users can collaborate.
- Format workflow recommendations as clear step-by-step pipelines with rationale.
- Be thorough and analytical — users are researchers who want depth, not surface-level answers.`;

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user.email?.toLowerCase().endsWith("@mit.edu")) {
      return new Response(JSON.stringify({ error: "Access restricted to MIT users" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, conversationId }: ChatRequest = await req.json();
    
    // --- Input validation ---
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length > 5000) {
      return new Response(JSON.stringify({ error: "message too long (max 5000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (conversationId && (typeof conversationId !== "string" || conversationId.length > 100)) {
      return new Response(JSON.stringify({ error: "Invalid conversationId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Phase 6: Per-user rate limiting
    const rl = checkRateLimit(`neuromcp-chat:${user.id}`, LLM_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(corsHeaders, rl.retryAfterMs);

    // Phase 5: Sanitize for prompt injection
    const sanitized = sanitizeForLLM(message);
    if (sanitized.injectionDetected) {
      console.warn(`Prompt injection detected in neuromcp-chat from user ${user.id}:`, sanitized.patternsMatched);
    }
    const sanitizedMessage = sanitized.sanitized;

    const startTime = Date.now();
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

    const { data: history } = await supabaseClient
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages: Message[] = history?.map((m) => ({ role: m.role as any, content: m.content })) || [];

    const contexts = await searchKnowledge(supabaseClient, sanitizedMessage);
    const systemPrompt = buildSystemPrompt(contexts);

    await supabaseClient.from("chat_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: message,
    });

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
          { role: "user", content: sanitizedMessage },
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
    const rawContent = chatData.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    // Phase 5: Scrub output for PII/secret leakage
    const { scrubbed: assistantContent, leaksDetected } = scrubOutput(rawContent);
    if (leaksDetected > 0) {
      console.error(`SECURITY: ${leaksDetected} potential data leaks scrubbed from neuromcp-chat output`);
    }

    const tokensUsed = chatData.usage?.total_tokens || 0;
    const latencyMs = Date.now() - startTime;
    const contextSources = contexts.map((c) => ({ type: c.source_type, title: c.title }));

    // Save assistant message
    await supabaseClient.from("chat_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "assistant",
      content: assistantContent,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      model: "google/gemini-2.5-flash",
      context_sources: contextSources,
    });

    // Write back interaction to knowledge_embeddings (fire-and-forget)
    writeBackInteraction(supabaseClient, {
      userMessage: message,
      assistantResponse: assistantContent,
      contextSources,
    });

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: convId,
        message: assistantContent,
        contextSources,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("NeuroMCP chat error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
