import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all publications with PMIDs that don't have keywords yet
    const { data: pubs, error } = await supabase
      .from("publications")
      .select("id, pmid, keywords")
      .not("pmid", "is", null);

    if (error) throw error;

    const needsKeywords = (pubs || []).filter(
      (p) => p.pmid && (!p.keywords || p.keywords.length === 0),
    );

    if (needsKeywords.length === 0) {
      return new Response(
        JSON.stringify({ message: "All publications already have keywords", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // PubMed E-Utilities: fetch article data in batches of 200
    const batchSize = 200;
    let totalUpdated = 0;

    for (let i = 0; i < needsKeywords.length; i += batchSize) {
      const batch = needsKeywords.slice(i, i + batchSize);
      const pmids = batch.map((p) => p.pmid).join(",");

      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids}&retmode=xml`;
      const res = await fetch(url);
      const xml = await res.text();

      // Parse keywords from XML for each PMID
      // Match each PubmedArticle block
      const articleBlocks = xml.split("<PubmedArticle>");

      for (const block of articleBlocks) {
        // Extract PMID
        const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        if (!pmidMatch) continue;
        const pmid = pmidMatch[1];

        // Extract MeSH terms
        const meshTerms: string[] = [];
        const meshMatches = block.matchAll(/<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g);
        for (const m of meshMatches) {
          meshTerms.push(m[1]);
        }

        // Extract author keywords
        const authorKeywords: string[] = [];
        const kwMatches = block.matchAll(/<Keyword[^>]*>([^<]+)<\/Keyword>/g);
        for (const m of kwMatches) {
          authorKeywords.push(m[1]);
        }

        // Combine: prefer author keywords, supplement with MeSH
        const allKeywords = [...new Set([...authorKeywords, ...meshTerms])].slice(0, 15);

        if (allKeywords.length > 0) {
          const pub = batch.find((p) => p.pmid === pmid);
          if (pub) {
            const { error: updateError } = await supabase
              .from("publications")
              .update({ keywords: allKeywords })
              .eq("id", pub.id);

            if (!updateError) totalUpdated++;
          }
        }
      }

      // Rate limit: NCBI asks for max 3 requests/sec without API key
      if (i + batchSize < needsKeywords.length) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    return new Response(
      JSON.stringify({ message: "Keywords synced", updated: totalUpdated, total: needsKeywords.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
