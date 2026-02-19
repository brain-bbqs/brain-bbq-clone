import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Fetches ALL NIH grants for a list of PI profile IDs.
 * Input: { profile_ids: number[] }
 * Output: { data: Record<number, Grant[]> } keyed by profileId
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_ids } = await req.json();

    if (!profile_ids || !Array.isArray(profile_ids) || profile_ids.length === 0) {
      return new Response(JSON.stringify({ error: "profile_ids array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query NIH Reporter for all grants by these PI profile IDs
    // Process in batches of 25 to avoid API limits
    const batchSize = 25;
    const allResults: Record<number, any[]> = {};
    
    // Initialize empty arrays
    for (const id of profile_ids) {
      allResults[id] = [];
    }

    for (let i = 0; i < profile_ids.length; i += batchSize) {
      const batch = profile_ids.slice(i, i + batchSize);
      
      // Fetch up to 500 results per batch
      const res = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: {
            pi_profile_ids: batch,
          },
          include_fields: [
            "ProjectNum",
            "ProjectTitle",
            "FiscalYear",
            "Organization",
            "AwardAmount",
            "PrincipalInvestigators",
            "ProjectDetailUrl",
          ],
          offset: 0,
          limit: 500,
        }),
      });

      if (!res.ok) {
        console.error(`NIH API batch ${i} error: ${res.status}`);
        continue;
      }

      const json = await res.json();
      const results = json?.results || [];

      // Assign each grant to the PI(s) it belongs to
      for (const project of results) {
        const pis = project.principal_investigators || [];
        for (const pi of pis) {
          const pid = pi.profile_id;
          if (pid && allResults[pid] !== undefined) {
            // Collect all co-PIs on this grant
            const coPis = pis.map((p: any) => ({
              name: [p.first_name, p.last_name].filter(Boolean).join(" "),
              profileId: p.profile_id || null,
              isContactPi: p.is_contact_pi || false,
            }));

            allResults[pid].push({
              grantNumber: project.project_num || "",
              title: project.project_title || "",
              fiscalYear: project.fiscal_year || null,
              awardAmount: project.award_amount || 0,
              institution: project.organization?.org_name || "",
              nihLink: project.project_detail_url || `https://reporter.nih.gov/project-details/${project.project_num}`,
              isContactPi: pi.is_contact_pi || false,
              coPis,
            });
          }
        }
      }
    }

    // Deduplicate grants per PI (same grant number, keep highest fiscal year)
    const deduplicated: Record<number, any[]> = {};
    for (const [pid, grants] of Object.entries(allResults)) {
      const grantMap = new Map<string, any>();
      for (const g of grants) {
        const existing = grantMap.get(g.grantNumber);
        if (!existing || (g.fiscalYear && g.fiscalYear > (existing.fiscalYear || 0))) {
          grantMap.set(g.grantNumber, g);
        }
      }
      deduplicated[Number(pid)] = Array.from(grantMap.values());
    }

    return new Response(JSON.stringify({ data: deduplicated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error fetching PI grants:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
