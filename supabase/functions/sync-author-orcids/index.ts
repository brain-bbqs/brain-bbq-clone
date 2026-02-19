import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all publications with PMIDs that don't have ORCIDs yet
    const { data: pubs, error } = await supabase
      .from("publications")
      .select("id, pmid, author_orcids")
      .not("pmid", "is", null);

    if (error) throw error;

    const needsOrcids = (pubs || []).filter(
      (p) => p.pmid && (!p.author_orcids || (Array.isArray(p.author_orcids) && p.author_orcids.length === 0)),
    );

    if (needsOrcids.length === 0) {
      return new Response(
        JSON.stringify({ message: "All publications already have ORCID data", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const batchSize = 100;
    let totalUpdated = 0;

    for (let i = 0; i < needsOrcids.length; i += batchSize) {
      const batch = needsOrcids.slice(i, i + batchSize);
      const pmids = batch.map((p) => p.pmid).join(",");

      // Fetch full XML from PubMed which includes ORCID identifiers in Author blocks
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids}&retmode=xml`;
      const res = await fetch(url);
      const xml = await res.text();

      // Parse each article
      const articleBlocks = xml.split("<PubmedArticle>");

      for (const block of articleBlocks) {
        const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        if (!pmidMatch) continue;
        const pmid = pmidMatch[1];

        // Extract authors with ORCIDs from the AuthorList
        const authorOrcids: { name: string; orcid: string }[] = [];
        
        // Match each Author block
        const authorBlocks = block.split("<Author ");
        for (const authorBlock of authorBlocks) {
          if (!authorBlock.includes("</Author>")) continue;
          
          const lastNameMatch = authorBlock.match(/<LastName>([^<]+)<\/LastName>/);
          const foreNameMatch = authorBlock.match(/<ForeName>([^<]+)<\/ForeName>/);
          const initialsMatch = authorBlock.match(/<Initials>([^<]+)<\/Initials>/);
          
          // ORCID appears as an Identifier with Source="ORCID"
          const orcidMatch = authorBlock.match(/<Identifier Source="ORCID"[^>]*>([^<]+)<\/Identifier>/);
          
          if (lastNameMatch) {
            const lastName = lastNameMatch[1];
            const firstName = foreNameMatch?.[1] || initialsMatch?.[1] || "";
            const displayName = `${lastName}, ${firstName}`.trim();
            
            if (orcidMatch) {
              // Clean ORCID - remove URL prefix if present
              let orcid = orcidMatch[1].trim();
              orcid = orcid.replace(/^https?:\/\/orcid\.org\//, "");
              authorOrcids.push({ name: displayName, orcid });
            }
          }
        }

        // Update even if empty array (marks as processed)
        if (authorOrcids.length > 0) {
          const pub = batch.find((p) => p.pmid === pmid);
          if (pub) {
            const { error: updateError } = await supabase
              .from("publications")
              .update({ author_orcids: authorOrcids })
              .eq("id", pub.id);

            if (!updateError) totalUpdated++;
          }
        }
      }

      // Rate limit
      if (i + batchSize < needsOrcids.length) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    return new Response(
      JSON.stringify({ message: "ORCID sync complete", updated: totalUpdated, total: needsOrcids.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
