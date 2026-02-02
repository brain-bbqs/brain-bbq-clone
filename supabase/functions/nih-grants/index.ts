import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface NIHProject {
  project_num: string;
  project_title: string;
  contact_pi_name: string;
  principal_investigators: Array<{ full_name: string; email?: string }>;
  organization: { org_name: string } | null;
  fiscal_year: number;
  award_amount: number;
  core_project_num: string;
}

interface NIHPublication {
  pmid: string;
  pub_title: string;
  pub_year: number;
  journal_title: string;
  authors: Array<{ author_name: string }>;
  cited_by_clin: number;
  relative_citation_ratio: number;
}

async function fetchPubMedDetails(pmids: string[]): Promise<Map<string, any>> {
  const detailsMap = new Map<string, any>();
  if (pmids.length === 0) return detailsMap;

  try {
    // Use iCite API to get publication details including RCR
    const response = await fetch(`https://icite.od.nih.gov/api/pubs?pmids=${pmids.join(",")}`);
    
    if (!response.ok) {
      console.error(`iCite API error: ${response.status}`);
      return detailsMap;
    }

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
    // First get PMIDs from NIH Reporter
    const response = await fetch("https://api.reporter.nih.gov/v2/publications/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        criteria: {
          core_project_nums: [coreProjectNum]
        },
        offset: 0,
        limit: 100
      })
    });

    if (!response.ok) {
      console.error(`Publications API error for ${coreProjectNum}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const nihPubs = data.results || [];
    
    if (nihPubs.length === 0) return [];

    // Extract PMIDs and fetch details from iCite
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
        criteria: {
          project_nums: [grantNumber]
        },
        include_fields: [
          "ProjectNum", "ProjectTitle", "ContactPiName", "PrincipalInvestigators",
          "Organization", "FiscalYear", "AwardAmount", "AbstractText", "CoreProjectNum"
        ],
        offset: 0,
        limit: 1
      })
    });

    if (!response.ok) {
      console.error(`NIH API error for ${grantNumber}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`No results for ${grantNumber}`);
      return null;
    }

    const project: NIHProject = data.results[0];
    const pis = project.principal_investigators || [];
    const coreProjectNum = project.core_project_num || grantNumber.replace(/\d$/, "");
    
    // Fetch publications for this grant
    const publications = await fetchPublications(coreProjectNum);
    
    return {
      grantNumber: project.project_num || grantNumber,
      title: project.project_title || "Unknown",
      abstract: data.results[0].abstract_text || "",
      contactPi: project.contact_pi_name || "Unknown",
      allPis: pis.map(pi => pi.full_name).join(", ") || project.contact_pi_name || "Unknown",
      institution: project.organization?.org_name || "Unknown",
      fiscalYear: project.fiscal_year || 0,
      awardAmount: project.award_amount || 0,
      nihLink: `https://reporter.nih.gov/project-details/${project.project_num?.replace(/[^a-zA-Z0-9]/g, "") || grantNumber}`,
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

  try {
    const url = new URL(req.url);
    const singleGrant = url.searchParams.get("grant");

    if (singleGrant) {
      const result = await fetchGrantData(singleGrant);
      return new Response(
        JSON.stringify({ success: true, data: result ? [result] : [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching ${GRANT_NUMBERS.length} grants from NIH Reporter...`);
    
    const results = [];
    for (const grant of GRANT_NUMBERS) {
      const projectData = await fetchGrantData(grant);
      if (projectData) {
        results.push(projectData);
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`Successfully fetched ${results.length} grants with publications`);

    return new Response(
      JSON.stringify({ success: true, data: results }),
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