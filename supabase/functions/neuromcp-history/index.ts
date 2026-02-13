import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is MIT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user || !user.email?.toLowerCase().endsWith("@mit.edu")) {
      return new Response(JSON.stringify({ error: "Access restricted to MIT users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all conversations with message counts
    const { data: conversations, error: convError } = await serviceClient
      .from("chat_conversations")
      .select("id, user_id, title, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (convError) throw convError;

    // Get user emails for all unique user_ids
    const userIds = [...new Set(conversations?.map((c: any) => c.user_id) || [])];
    const userEmails: Record<string, string> = {};
    
    for (const uid of userIds) {
      const { data: { user: u } } = await serviceClient.auth.admin.getUserById(uid);
      if (u?.email) userEmails[uid] = u.email;
    }

    // For each conversation, get the messages
    const enriched = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const { data: messages } = await serviceClient
          .from("chat_messages")
          .select("role, content, created_at, tokens_used, latency_ms, model, context_sources")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true })
          .limit(50);

        return {
          ...conv,
          userEmail: userEmails[conv.user_id] || "unknown",
          messages: messages || [],
        };
      })
    );

    return new Response(JSON.stringify({ conversations: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("History error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
