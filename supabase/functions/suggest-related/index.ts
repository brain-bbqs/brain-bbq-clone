import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Computes Jaccard similarity between two string arrays.
 */
function jaccard(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const setA = new Set(a.map(s => s.toLowerCase().trim()));
  const setB = new Set(b.map(s => s.toLowerCase().trim()));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const targetGrantNumber = body.grant_number as string | undefined;
    const threshold = body.threshold ?? 0.15;
    const maxSuggestions = body.max ?? 5;

    // Fetch all projects
    const { data: projects, error } = await sb
      .from("projects")
      .select("id, grant_number, study_species, use_approaches, use_sensors, produce_data_modality, use_analysis_method, keywords, related_project_ids");
    if (error) throw error;
    if (!projects?.length) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build comparison fields for each project
    const fields = ["study_species", "use_approaches", "use_sensors", "produce_data_modality", "use_analysis_method", "keywords"] as const;

    const projectsToProcess = targetGrantNumber
      ? projects.filter(p => p.grant_number === targetGrantNumber)
      : projects;

    const results: { grant_number: string; suggestions: { grant_number: string; score: number; shared_fields: Record<string, string[]> }[]; updated: boolean }[] = [];

    for (const project of projectsToProcess) {
      const scores: { other: typeof projects[0]; score: number; shared: Record<string, string[]> }[] = [];

      for (const other of projects) {
        if (other.grant_number === project.grant_number) continue;

        let totalScore = 0;
        const shared: Record<string, string[]> = {};

        for (const field of fields) {
          const a = (project as any)[field] || [];
          const b = (other as any)[field] || [];
          const sim = jaccard(a, b);
          totalScore += sim;

          // Track shared values
          if (sim > 0) {
            const setA = new Set((a as string[]).map(s => s.toLowerCase().trim()));
            shared[field] = (b as string[]).filter(s => setA.has(s.toLowerCase().trim()));
          }
        }

        const avgScore = totalScore / fields.length;
        if (avgScore >= threshold) {
          scores.push({ other, score: Math.round(avgScore * 100) / 100, shared });
        }
      }

      // Sort by score desc, take top N
      scores.sort((a, b) => b.score - a.score);
      const topSuggestions = scores.slice(0, maxSuggestions);

      const suggestedIds = topSuggestions.map(s => s.other.id);
      const existingIds = project.related_project_ids || [];
      const newIds = [...new Set([...existingIds, ...suggestedIds])];

      let updated = false;
      if (newIds.length > existingIds.length) {
        await sb.from("projects").update({ related_project_ids: newIds }).eq("grant_number", project.grant_number);
        updated = true;
      }

      results.push({
        grant_number: project.grant_number,
        suggestions: topSuggestions.map(s => ({
          grant_number: s.other.grant_number,
          score: s.score,
          shared_fields: s.shared,
        })),
        updated,
      });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-related error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
