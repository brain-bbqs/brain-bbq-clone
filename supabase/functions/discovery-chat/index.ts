import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- 1. Get embedding for user query ---
    const embeddingRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: query,
        }),
      }
    );

    let ragContext = "";

    if (embeddingRes.ok) {
      const embData = await embeddingRes.json();
      const queryEmbedding = embData?.data?.[0]?.embedding;

      if (queryEmbedding) {
        // --- 2. Semantic search ---
        const { data: matches } = await supabase.rpc(
          "search_knowledge_embeddings",
          {
            query_embedding: `[${queryEmbedding.join(",")}]`,
            match_threshold: 0.5,
            match_count: 8,
          }
        );

        if (matches?.length) {
          ragContext = matches
            .map(
              (m: any) =>
                `[${m.source_type}] ${m.title}\n${m.content.slice(0, 600)}`
            )
            .join("\n---\n");
        }
      }
    }

    // --- 3. Also do a direct DB search for people, projects, tools ---
    const q = `%${query}%`;
    const [piRes, grantRes, pubRes, toolRes] = await Promise.all([
      supabase
        .from("investigators")
        .select("name, email, orcid, research_areas")
        .ilike("name", q)
        .limit(5),
      supabase.from("grants").select("title, grant_number").ilike("title", q).limit(5),
      supabase.from("publications").select("title, pmid, journal, year").ilike("title", q).limit(5),
      supabase
        .from("resources")
        .select("name, description, external_url, metadata")
        .in("resource_type", ["software", "tool"])
        .ilike("name", q)
        .limit(5),
    ]);

    const dbContext: string[] = [];
    if (piRes.data?.length) {
      dbContext.push(
        "INVESTIGATORS:\n" +
          piRes.data
            .map(
              (p: any) =>
                `- ${p.name}${p.orcid ? ` (ORCID: ${p.orcid})` : ""}${p.research_areas?.length ? ` — Areas: ${p.research_areas.join(", ")}` : ""}`
            )
            .join("\n")
      );
    }
    if (grantRes.data?.length) {
      dbContext.push(
        "GRANTS:\n" +
          grantRes.data.map((g: any) => `- ${g.title} (${g.grant_number})`).join("\n")
      );
    }
    if (pubRes.data?.length) {
      dbContext.push(
        "PUBLICATIONS:\n" +
          pubRes.data
            .map((p: any) => `- ${p.title}${p.pmid ? ` (PMID: ${p.pmid})` : ""}${p.journal ? ` — ${p.journal}` : ""}${p.year ? ` (${p.year})` : ""}`)
            .join("\n")
      );
    }
    if (toolRes.data?.length) {
      dbContext.push(
        "SOFTWARE TOOLS:\n" +
          toolRes.data.map((t: any) => `- ${t.name}: ${t.description || ""}${t.external_url ? ` → ${t.external_url}` : ""}`).join("\n")
      );
    }

    const fullContext = [ragContext, ...dbContext].filter(Boolean).join("\n\n===\n\n");

    // --- 4. Log query anonymously ---
    await supabase
      .from("search_queries")
      .insert({ query, mode: "chat", results_count: (piRes.data?.length || 0) + (grantRes.data?.length || 0) + (pubRes.data?.length || 0) + (toolRes.data?.length || 0) });

    // --- 5. Call Lovable AI ---
    const systemPrompt = `You are a discovery assistant for the BBQS (Brain Behavior Quantification & Synchronization) consortium website. Your job is to help researchers find relevant people, projects, publications, software tools, datasets, and resources within the consortium.

IMPORTANT RULES:
- Be concise and helpful. Use bullet points and links when possible.
- When you mention a page, include the path (e.g., /projects, /publications, /investigators, /resources, /species).
- If the context contains matching results, present them clearly.
- If no matches are found, suggest related pages the user might explore.
- Always mention specific names, grant numbers, or tool names when available.
- Keep responses under 300 words.

CONTEXT FROM BBQS DATABASE:
${fullContext || "No specific matches found in the database for this query."}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("discovery-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
