import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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
  "U24MH136628", "R24MH136632",
  "1U01DA063565", "1U01DA063581", "1R61MH138612"
];

async function fetchPubMedKeywords(pmids: string[]): Promise<Map<string, string[]>> {
  const keywordsMap = new Map<string, string[]>();
  if (pmids.length === 0) return keywordsMap;

  try {
    // Batch in groups of 50 to avoid URL length limits
    const batchSize = 50;
    for (let i = 0; i < pmids.length; i += batchSize) {
      const batch = pmids.slice(i, i + batchSize);
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${batch.join(",")}&rettype=xml&retmode=xml`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const xml = await response.text();

      // Parse keywords from XML for each article
      const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
      let match;
      while ((match = articleRegex.exec(xml)) !== null) {
        const article = match[1];
        // Extract PMID
        const pmidMatch = article.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        if (!pmidMatch) continue;
        const pmid = pmidMatch[1];

        const keywords: string[] = [];

        // Extract MeSH terms (descriptors only)
        const meshRegex = /<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g;
        let meshMatch;
        while ((meshMatch = meshRegex.exec(article)) !== null) {
          keywords.push(meshMatch[1]);
        }

        // Extract author-supplied keywords
        const kwRegex = /<Keyword[^>]*>([^<]+)<\/Keyword>/g;
        let kwMatch;
        while ((kwMatch = kwRegex.exec(article)) !== null) {
          if (!keywords.includes(kwMatch[1])) {
            keywords.push(kwMatch[1]);
          }
        }

        keywordsMap.set(pmid, keywords);
      }

      // Small delay between batches
      if (i + batchSize < pmids.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  } catch (err) {
    console.error("Error fetching PubMed keywords:", err);
  }

  return keywordsMap;
}

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
    
    // Fetch iCite details and PubMed keywords in parallel
    const [detailsMap, keywordsMap] = await Promise.all([
      fetchPubMedDetails(pmids),
      fetchPubMedKeywords(pmids),
    ]);

    return nihPubs.map((pub: any) => {
      const pmid = String(pub.pmid);
      const details = detailsMap.get(pmid) || {};
      const keywords = keywordsMap.get(pmid) || [];
      return {
        pmid,
        title: details.title || "Unknown",
        year: details.year || 0,
        journal: details.journal || "Unknown",
        authors: details.authors || "",
        citations: details.citations || 0,
        rcr: details.rcr || 0,
        keywords,
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ACTION: refresh — fetch from NIH APIs and upsert into grants table
    if (action === "refresh") {
      console.log(`Refreshing ${GRANT_NUMBERS.length} grants from NIH Reporter...`);

      let updatedCount = 0;
      const errors: string[] = [];

      for (const grant of GRANT_NUMBERS) {
        try {
          const projectData = await fetchGrantData(grant);
          if (projectData) {
            // Upsert into grants table directly
            await supabase
              .from("grants")
              .upsert({
                grant_number: grant,
                title: (projectData as any).title || "Unknown",
                abstract: (projectData as any).abstract || null,
                award_amount: (projectData as any).awardAmount || null,
                fiscal_year: (projectData as any).fiscalYear || null,
                nih_link: (projectData as any).nihLink || null,
                updated_at: new Date().toISOString(),
              }, { onConflict: "grant_number" });
            updatedCount++;
          }
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (err) {
          errors.push(`${grant}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }

      console.log(`Refresh complete: ${updatedCount} grants updated, ${errors.length} errors`);

      return new Response(
        JSON.stringify({ success: true, updated: updatedCount, errors: errors.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DEFAULT: serve grant data from grants table with full joins
    const { data: grants, error: grantsError } = await supabase
      .from("grants")
      .select("*")
      .order("grant_number");

    if (grantsError) {
      throw new Error(`Grants read error: ${grantsError.message}`);
    }

    // If no grants, do an initial fetch
    if (!grants || grants.length === 0) {
      console.log("No grants found, performing initial data fetch...");
      
      const results = [];
      for (const grant of GRANT_NUMBERS) {
        const projectData = await fetchGrantData(grant);
        if (projectData) {
          await supabase
            .from("grants")
            .upsert({
              grant_number: grant,
              title: (projectData as any).title || "Unknown",
              abstract: (projectData as any).abstract || null,
              award_amount: (projectData as any).awardAmount || null,
              fiscal_year: (projectData as any).fiscalYear || null,
              nih_link: (projectData as any).nihLink || null,
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

    // Fetch investigators with their organizations for all grants
    const grantIds = grants.map(g => g.id);
    const { data: grantInvestigators } = await supabase
      .from("grant_investigators")
      .select("grant_id, role, investigator_id")
      .in("grant_id", grantIds);

    const investigatorIds = [...new Set((grantInvestigators || []).map(gi => gi.investigator_id))];
    
    const { data: investigators } = investigatorIds.length > 0
      ? await supabase.from("investigators").select("id, name, email, orcid, scholar_id").in("id", investigatorIds)
      : { data: [] };

    const { data: invOrgs } = investigatorIds.length > 0
      ? await supabase.from("investigator_organizations").select("investigator_id, organization_id").in("investigator_id", investigatorIds)
      : { data: [] };

    const orgIds = [...new Set((invOrgs || []).map(io => io.organization_id))];
    const { data: organizations } = orgIds.length > 0
      ? await supabase.from("organizations").select("id, name").in("id", orgIds)
      : { data: [] };

    // Build lookup maps
    const invMap = new Map((investigators || []).map(i => [i.id, i]));
    const orgMap = new Map((organizations || []).map(o => [o.id, o]));
    const invOrgMap = new Map<string, string[]>();
    (invOrgs || []).forEach(io => {
      const orgs = invOrgMap.get(io.investigator_id) || [];
      orgs.push(io.organization_id);
      invOrgMap.set(io.investigator_id, orgs);
    });

    // Fetch publications from NIH Reporter for each grant in parallel
    // Core project num: strip leading numeric prefix (e.g. "1U01DA063534" -> "U01DA063534")
    // and any trailing suffix like "-01"
    const pubPromises = grants.map(async (g) => {
      const coreProjectNum = g.grant_number.replace(/^\d+/, "").replace(/-\d+$/, "");
      const pubs = await fetchPublications(coreProjectNum);
      return { grantNumber: g.grant_number, publications: pubs };
    });
    const pubResults = await Promise.all(pubPromises);
    const grantPubMap = new Map(pubResults.map(r => [r.grantNumber, r.publications]));

    const results = grants.map(g => {
      // Get PIs for this grant
      const gis = (grantInvestigators || []).filter(gi => gi.grant_id === g.id);
      const piDetails = gis.map(gi => {
        const inv = invMap.get(gi.investigator_id);
        return {
          fullName: inv?.name || "Unknown",
          firstName: (inv?.name || "").split(" ")[0] || "",
          lastName: (inv?.name || "").split(" ").slice(-1)[0] || "",
          profileId: null,
          isContactPi: gi.role === "contact_pi",
        };
      });

      const contactPi = piDetails.find(pi => pi.isContactPi);
      const allPiNames = piDetails.map(pi => pi.fullName).join(", ");

      // Get institution from contact PI's org, or first PI's org
      let institution = "Unknown";
      const contactPiGi = gis.find(gi => gi.role === "contact_pi") || gis[0];
      if (contactPiGi) {
        const orgIds = invOrgMap.get(contactPiGi.investigator_id) || [];
        if (orgIds.length > 0) {
          const org = orgMap.get(orgIds[0]);
          if (org) institution = org.name;
        }
      }

      // Get publications for this grant from NIH Reporter
      const pubs = grantPubMap.get(g.grant_number) || [];

      return {
        grantNumber: g.grant_number,
        title: g.title,
        abstract: g.abstract,
        contactPi: contactPi?.fullName || allPiNames.split(",")[0]?.trim() || "Unknown",
        allPis: allPiNames || "Unknown",
        piDetails: piDetails.length > 0 ? piDetails : undefined,
        institution,
        fiscalYear: g.fiscal_year,
        awardAmount: g.award_amount,
        nihLink: g.nih_link,
        publications: pubs,
        publicationCount: pubs.length,
      };
    });

    return new Response(
      JSON.stringify({ success: true, data: results, source: "grants_table" }),
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
