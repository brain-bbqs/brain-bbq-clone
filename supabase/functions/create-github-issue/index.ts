import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();

    // Validate inputs
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      console.error("Validation failed: title is required");
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (title.length > 256) {
      console.error("Validation failed: title too long");
      return new Response(
        JSON.stringify({ error: "Title must be less than 256 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (description && description.length > 65536) {
      console.error("Validation failed: description too long");
      return new Response(
        JSON.stringify({ error: "Description must be less than 65536 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "GitHub integration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const owner = "brain-bbqs";
    const repo = "brain-bbq-clone";

    console.log(`Creating issue: "${title.trim()}" in ${owner}/${repo}`);

    // Create the issue with bug label
    const issueResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "BBQS-Issue-Reporter",
        },
        body: JSON.stringify({
          title: title.trim(),
          body: description?.trim() || "No description provided.",
          labels: ["bug"],
        }),
      }
    );

    if (!issueResponse.ok) {
      const errorText = await issueResponse.text();
      console.error(`GitHub API error: ${issueResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to create issue on GitHub" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const issue = await issueResponse.json();
    console.log(`Issue created successfully: #${issue.number} - ${issue.html_url}`);

    return new Response(
      JSON.stringify({
        success: true,
        issue: {
          number: issue.number,
          url: issue.html_url,
          title: issue.title,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating GitHub issue:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
