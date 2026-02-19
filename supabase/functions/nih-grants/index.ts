import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRANT_NUMBERS = [
  "R34DA059510", "R34DA059509", "R34DA059513", "R34DA059507",
  "R34DA059718", "R34DA059506", "R34DA059512", "R34DA059716",
  "R34DA059723", "R34DA059514", "R34DA059500", "R34DA061984",
  "R34DA061924", "R34DA061925", "R34DA062119", "R61MH135106",
  "R61MH135109", "R61MH135114", "R61MH135405", "R61MH135407",
  "R61MH138966", "R61MH138713", "R61MH138705", "1U01DA063534",
  "U24MH136628", "R24MH136632"
];

async function fetchPubMedDetails(pmids: string[]): Promise<Map<string, any>> {
  const detailsMap = new Map<string, any>();
  if (pmids.length === 0) return detailsMap;

  try {
    const response = await fetch(`https://icite.od.nih.gov/api/pubs?pmids=${pmids.join(",")}`);
    if (!response.ok) return detailsMap;

    const data = await response.json();
    const pubs = data.data || data;
    
    for (const pub of pubs) {
      detailsMap.set(String(pub.pmid), {
        title: pub.title || "Unknown",
        year: pub.year || 0,
        journal: pub.journal || "Unknown",
        authors: pub.authors || "",
        citations: pub.citation_count || 0,
        rcr: pub.relative_citation_ratio || 0,
        doi: pub.doi || ""
      });
    }
  } catch (err) {
    console.error("Error fetching iCite details:", err);
  }

  return detailsMap;
}

async function fetchPublications(coreProjectNum: string): Promise<any[]> {
  try {
    const response = await fetch("https://api.reporter.nih.gov/v2/publications/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        criteria: { core_project_nums: [coreProjectNum] },
        offset: 0,
        limit: 100
      })
    });

    if (!response.ok) return [];

    const data = await response.json();
    const nihPubs = data.results || [];
    if (nihPubs.length === 0) return [];

    const pmids = nihPubs.map((p: any) => String(p.pmid)).filter(Boolean);
    const detailsMap = await fetchPubMedDetails(pmids);

    return nihPubs.map((pub: any) => {
      const pmid = String(pub.pmid);
      const details = detailsMap.get(pmid) || {};
      return {
        pmid,
        title: details.title || "Unknown",
        year: details.year || 0,
        journal: details.journal || "Unknown",
        authors: details.authors || "",
        citations: details.citations || 0,
        rcr: details.rcr || 0,
        pubmedLink: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : ""
      };
    });
  } catch (err) {
    console.error(`Error fetching publications for ${coreProjectNum}:`, err);
    return [];
  }
}

async function fetchGrantData(grantNumber: string): Promise<any | null> {
  try {
    const response = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        criteria: { project_nums: [grantNumber] },
        include_fields: [
          "ProjectNum", "ProjectTitle", "ContactPiName", "PrincipalInvestigators",
          "Organization", "FiscalYear", "AwardAmount", "AbstractText", "CoreProjectNum"
        ],
        offset: 0,
        limit: 1
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const project = data.results[0];
    const pis = project.principal_investigators || [];
    const coreProjectNum = project.core_project_num || grantNumber.replace(/\d$/, "");
    const publications = await fetchPublications(coreProjectNum);
    
    const piDetails = pis.map((pi: any) => ({
      fullName: pi.full_name || "",
      firstName: pi.first_name || "",
      lastName: pi.last_name || "",
      profileId: pi.profile_id || null,
      isContactPi: pi.is_contact_pi || false,
    }));

    return {
      grantNumber: project.project_num || grantNumber,
      title: project.project_title || "Unknown",
      abstract: project.abstract_text || "",
      contactPi: project.contact_pi_name || "Unknown",
      allPis: pis.map((pi: any) => pi.full_name).join(", ") || project.contact_pi_name || "Unknown",
      piDetails,
      institution: project.organization?.org_name || "Unknown",
      fiscalYear: project.fiscal_year || 0,
      awardAmount: project.award_amount || 0,
      nihLink: `https://reporter.nih.gov/project-details/${encodeURIComponent(project.project_num || grantNumber)}`,
      publications,
      publicationCount: publications.length
    };
  } catch (err) {
    console.error(`Error fetching ${grantNumber}:`, err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ACTION: refresh — fetch from NIH APIs and update cache
    if (action === "refresh") {
      console.log(`Refreshing ${GRANT_NUMBERS.length} grants from NIH Reporter...`);

      // Create sync log entry
      const { data: syncLog } = await supabase
        .from("nih_grants_sync_log")
        .insert({ status: "running" })
        .select("id")
        .single();

      let updatedCount = 0;
      const errors: string[] = [];

      for (const grant of GRANT_NUMBERS) {
        try {
          const projectData = await fetchGrantData(grant);
          if (projectData) {
            await supabase
              .from("nih_grants_cache")
              .upsert({
                grant_number: grant,
                data: projectData,
                updated_at: new Date().toISOString(),
              }, { onConflict: "grant_number" });
            updatedCount++;
          }
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (err) {
          errors.push(`${grant}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }

      // Update sync log
      if (syncLog) {
        await supabase
          .from("nih_grants_sync_log")
          .update({
            completed_at: new Date().toISOString(),
            grants_updated: updatedCount,
            status: errors.length > 0 ? "completed_with_errors" : "completed",
            error_message: errors.length > 0 ? errors.join("; ") : null,
          })
          .eq("id", syncLog.id);
      }

      console.log(`Refresh complete: ${updatedCount} grants updated, ${errors.length} errors`);

      return new Response(
        JSON.stringify({ success: true, updated: updatedCount, errors: errors.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DEFAULT: serve cached data from DB
    const { data: cached, error: cacheError } = await supabase
      .from("nih_grants_cache")
      .select("data")
      .order("grant_number");

    if (cacheError) {
      throw new Error(`Cache read error: ${cacheError.message}`);
    }

    // If cache is empty, do an initial refresh
    if (!cached || cached.length === 0) {
      console.log("Cache empty, performing initial data fetch...");
      
      const results = [];
      for (const grant of GRANT_NUMBERS) {
        const projectData = await fetchGrantData(grant);
        if (projectData) {
          await supabase
            .from("nih_grants_cache")
            .upsert({
              grant_number: grant,
              data: projectData,
              updated_at: new Date().toISOString(),
            }, { onConflict: "grant_number" });
          results.push(projectData);
        }
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      return new Response(
        JSON.stringify({ success: true, data: results, source: "fresh" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = cached.map(row => row.data);

    return new Response(
      JSON.stringify({ success: true, data: results, source: "cache" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nih-grants function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
