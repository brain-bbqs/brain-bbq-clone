import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, requireAuth } from "../_shared/auth.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Require authentication
  const auth = await requireAuth(req, corsHeaders);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { title, description, labels: customLabels, milestone, action, issue_number, state, assignees } = body;

    // Validate description length to prevent abuse
    if (description && (typeof description !== "string" || description.length > 10000)) {
      return new Response(
        JSON.stringify({ error: "Description too long (max 10000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Validate issue_number if provided
    if (issue_number !== undefined && (typeof issue_number !== "number" || issue_number < 1 || issue_number > 999999)) {
      return new Response(
        JSON.stringify({ error: "Invalid issue_number" }),
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
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "BBQS-Issue-Reporter",
    };

    // Update an existing issue (e.g. close it)
    if (action === "update" && issue_number) {
      const body: Record<string, unknown> = {};
      if (state) body.state = state;
      if (customLabels) body.labels = customLabels;
      if (milestone !== undefined) body.milestone = milestone;
      if (assignees) body.assignees = assignees;

      const resp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`,
        { method: "PATCH", headers: ghHeaders, body: JSON.stringify(body) }
      );
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`GitHub API error: ${resp.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: "Failed to update issue" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const issue = await resp.json();
      return new Response(
        JSON.stringify({ success: true, issue: { number: issue.number, url: issue.html_url, state: issue.state } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a new issue
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (title.length > 256) {
      return new Response(
        JSON.stringify({ error: "Title must be less than 256 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating issue: "${title.trim()}" in ${owner}/${repo}`);

    const issueResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        headers: ghHeaders,
        body: JSON.stringify({
          title: title.trim(),
          body: description?.trim() || "No description provided.",
          labels: Array.isArray(customLabels) ? customLabels : ["bug"],
          ...(milestone ? { milestone } : {}),
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

    // If the issue has the 'claude' label, post a comment to trigger the Claude workflow
    if (Array.isArray(customLabels) && customLabels.includes("claude")) {
      try {
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issue.number}/comments`,
          {
            method: "POST",
            headers: ghHeaders,
            body: JSON.stringify({ body: "@claude Please analyze this feature request and implement it." }),
          }
        );
        console.log(`Posted @claude comment on issue #${issue.number}`);
      } catch (commentErr) {
        console.error("Failed to post @claude comment:", commentErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        issue: { number: issue.number, url: issue.html_url, title: issue.title },
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
