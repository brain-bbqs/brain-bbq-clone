import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const GRANT_NUMBERS = [
  "R34DA059510", "R34DA059509", "R34DA059513", "R34DA059507",
  "R34DA059718", "R34DA059506", "R34DA059512", "R34DA059716",
  "R34DA059723", "R34DA059514", "R34DA059500", "R34DA061984",
  "R34DA061924", "R34DA061925", "R34DA062119", "R61MH135106",
  "R61MH135109", "R61MH135114", "R61MH135405", "R61MH135407",
  "R61MH138966", "R61MH138713", "R61MH138705", "1U01DA063534",
  "U24MH136628", "R24MH136632"
];

// Generate embedding for text
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // Limit input size
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Fetch projects from NIH Reporter
async function fetchProjects(): Promise<any[]> {
  const results = [];
  
  for (const grant of GRANT_NUMBERS) {
    try {
      const response = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: { project_nums: [grant] },
          include_fields: ["ProjectNum", "ProjectTitle", "ContactPiName", "PrincipalInvestigators", "Organization", "AbstractText"],
          offset: 0,
          limit: 1,
        }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      if (data.results?.[0]) {
        results.push(data.results[0]);
      }
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`Error fetching ${grant}:`, err);
    }
  }
  
  return results;
}

// Fetch publications for grants
async function fetchPublications(): Promise<any[]> {
  const allPubs: any[] = [];
  const seenPmids = new Set<string>();

  for (const grant of GRANT_NUMBERS) {
    try {
      const coreNum = grant.replace(/\d$/, "");
      const response = await fetch("https://api.reporter.nih.gov/v2/publications/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: { core_project_nums: [coreNum] },
          offset: 0,
          limit: 50,
        }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      
      for (const pub of data.results || []) {
        if (pub.pmid && !seenPmids.has(pub.pmid)) {
          seenPmids.add(pub.pmid);
          allPubs.push(pub);
        }
      }
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`Error fetching pubs:`, err);
    }
  }

  // Enrich with iCite data
  if (allPubs.length > 0) {
    const pmids = allPubs.map((p: any) => p.pmid).join(",");
    try {
      const iciteRes = await fetch(`https://icite.od.nih.gov/api/pubs?pmids=${pmids}`);
      if (iciteRes.ok) {
        const iciteData = await iciteRes.json();
        const iciteMap = new Map<string, any>(iciteData.data?.map((p: any) => [String(p.pmid), p]) || []);
        for (const pub of allPubs) {
          const icite = iciteMap.get(String(pub.pmid));
          if (icite) {
            (pub as any).title = icite.title;
            (pub as any).authors = icite.authors;
            (pub as any).journal = icite.journal;
            (pub as any).year = icite.year;
          }
        }
      }
    } catch (err) {
      console.error("iCite error:", err);
    }
  }

  return allPubs;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple auth check - could be enhanced with admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const stats = { projects: 0, publications: 0, investigators: 0, errors: 0 };

    console.log("Starting knowledge ingestion...");

    // 1. Ingest Projects
    console.log("Fetching projects from NIH Reporter...");
    const projects = await fetchProjects();
    
    for (const proj of projects) {
      try {
        const content = `Project: ${proj.project_title}\n\nAbstract: ${proj.abstract_text || "No abstract available"}\n\nInstitution: ${proj.organization?.org_name || "Unknown"}`;
        const embedding = await generateEmbedding(content);
        
        const pis = proj.principal_investigators?.map((pi: any) => pi.full_name).join(", ") || proj.contact_pi_name;
        
        await supabase.from("knowledge_embeddings").upsert({
          source_type: "project",
          source_id: proj.project_num,
          title: proj.project_title,
          content: content,
          metadata: {
            grant_number: proj.project_num,
            pis: pis,
            institution: proj.organization?.org_name,
          },
          embedding: `[${embedding.join(",")}]`,
        }, { onConflict: "source_type,source_id" });
        
        stats.projects++;
        await new Promise((r) => setTimeout(r, 200)); // Rate limit embeddings
      } catch (err) {
        console.error(`Project error ${proj.project_num}:`, err);
        stats.errors++;
      }
    }

    // 2. Ingest Investigators (from projects)
    const investigators = new Map<string, { name: string; projects: string[]; institution?: string }>();
    for (const proj of projects) {
      const pis = proj.principal_investigators || [];
      for (const pi of pis) {
        const existing = investigators.get(pi.full_name) || { name: pi.full_name, projects: [] as string[], institution: proj.organization?.org_name };
        existing.projects.push(proj.project_title as string);
        investigators.set(pi.full_name, existing);
      }
    }

    for (const [name, data] of investigators) {
      try {
        const content = `Principal Investigator: ${name}\nInstitution: ${data.institution || "Unknown"}\nProjects: ${data.projects.join("; ")}`;
        const embedding = await generateEmbedding(content);
        
        await supabase.from("knowledge_embeddings").upsert({
          source_type: "investigator",
          source_id: name.replace(/\s+/g, "_").toLowerCase(),
          title: name,
          content: content,
          metadata: { institution: data.institution, project_count: data.projects.length },
          embedding: `[${embedding.join(",")}]`,
        }, { onConflict: "source_type,source_id" });
        
        stats.investigators++;
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error(`Investigator error ${name}:`, err);
        stats.errors++;
      }
    }

    // 3. Ingest Publications
    console.log("Fetching publications...");
    const publications = await fetchPublications();
    
    for (const pub of publications.slice(0, 100)) { // Limit to 100 for now
      try {
        const content = `Publication: ${pub.title || "Unknown Title"}\nAuthors: ${pub.authors || "Unknown"}\nJournal: ${pub.journal || "Unknown"}\nYear: ${pub.year || "Unknown"}`;
        const embedding = await generateEmbedding(content);
        
        await supabase.from("knowledge_embeddings").upsert({
          source_type: "publication",
          source_id: `pmid_${pub.pmid}`,
          title: pub.title || "Unknown Publication",
          content: content,
          metadata: { pmid: pub.pmid, journal: pub.journal, year: pub.year },
          embedding: `[${embedding.join(",")}]`,
        }, { onConflict: "source_type,source_id" });
        
        stats.publications++;
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error(`Publication error:`, err);
        stats.errors++;
      }
    }

    console.log("Ingestion complete:", stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ingestion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
