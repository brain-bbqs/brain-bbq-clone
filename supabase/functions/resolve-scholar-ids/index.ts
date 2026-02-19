import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Strip middle initials for better search: "Steve W. C. Chang" → "Steve Chang"
 */
function simplifyName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Scrape Google Scholar author search page to extract user ID.
 * Returns the Scholar user ID or null.
 */
async function resolveScholarId(name: string): Promise<string | null> {
  const searchName = simplifyName(name);
  const url = `https://scholar.google.com/citations?view_op=search_authors&mauthors=${encodeURIComponent(searchName)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.log(`Scholar returned ${response.status} for ${searchName}`);
      return null;
    }

    const html = await response.text();
    
    // Extract user ID from the first profile link: /citations?hl=en&user=XXXXXXX
    const match = html.match(/\/citations\?[^"]*user=([A-Za-z0-9_-]+)/);
    if (match) {
      return match[1];
    }
    
    console.log(`No Scholar profile found for ${searchName}`);
    return null;
  } catch (err) {
    console.error(`Error resolving Scholar ID for ${searchName}:`, err);
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
    // Get all investigators without a scholar_id
    const { data: investigators, error } = await supabase
      .from("investigators")
      .select("id, name, scholar_id")
      .is("scholar_id", null);

    if (error) throw error;
    if (!investigators || investigators.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All investigators already have Scholar IDs", resolved: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Resolving Scholar IDs for ${investigators.length} investigators...`);

    let resolved = 0;
    const results: { name: string; scholarId: string | null }[] = [];

    for (const inv of investigators) {
      const scholarId = await resolveScholarId(inv.name);
      results.push({ name: inv.name, scholarId });

      if (scholarId) {
        const { error: updateErr } = await supabase
          .from("investigators")
          .update({ scholar_id: scholarId })
          .eq("id", inv.id);

        if (updateErr) {
          console.error(`Failed to update ${inv.name}:`, updateErr);
        } else {
          resolved++;
          console.log(`✓ ${inv.name} → ${scholarId}`);
        }
      } else {
        console.log(`✗ ${inv.name} — no profile found`);
      }

      // Rate limit: 2 seconds between requests to avoid being blocked
      await new Promise((r) => setTimeout(r, 2000));
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: investigators.length,
        resolved,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in resolve-scholar-ids:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
