import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Normalizes free-text tags in project metadata by matching them
 * against canonical values in the taxonomies table.
 * Uses case-insensitive fuzzy matching (Levenshtein distance).
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

const FIELD_TO_CATEGORY: Record<string, string> = {
  study_species: "species",
  use_approaches: "approach",
  use_sensors: "sensor",
  produce_data_modality: "data_modality",
  use_analysis_method: "analysis_method",
  keywords: "keyword",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // default to dry_run=true
    const maxDistance = body.max_distance ?? 2;

    // Fetch taxonomies
    const { data: taxonomies, error: taxErr } = await sb.from("taxonomies").select("*");
    if (taxErr) throw taxErr;

    // Build lookup: category -> canonical values
    const canonicalByCategory = new Map<string, { value: string; label: string }[]>();
    for (const t of (taxonomies || [])) {
      if (!canonicalByCategory.has(t.category)) canonicalByCategory.set(t.category, []);
      canonicalByCategory.get(t.category)!.push({ value: t.value, label: t.label || t.value });
    }

    // Fetch all projects
    const { data: projects, error: projErr } = await sb.from("projects").select("*");
    if (projErr) throw projErr;

    const normalizations: { grant_number: string; field: string; original: string; normalized: string; distance: number }[] = [];
    const updatedProjects: { grant_number: string; updates: Record<string, string[]> }[] = [];

    for (const project of (projects || [])) {
      const updates: Record<string, string[]> = {};

      for (const [field, category] of Object.entries(FIELD_TO_CATEGORY)) {
        const values = (project as any)[field] as string[] | null;
        if (!values?.length) continue;

        const canonicals = canonicalByCategory.get(category) || [];
        if (!canonicals.length) continue;

        const normalized: string[] = [];
        let changed = false;

        for (const val of values) {
          const lower = val.toLowerCase().trim();
          
          // Exact match first
          const exactMatch = canonicals.find(c => c.value.toLowerCase() === lower);
          if (exactMatch) {
            normalized.push(exactMatch.value);
            if (exactMatch.value !== val) {
              changed = true;
              normalizations.push({ grant_number: project.grant_number, field, original: val, normalized: exactMatch.value, distance: 0 });
            }
            continue;
          }

          // Fuzzy match
          let bestMatch: { value: string; dist: number } | null = null;
          for (const c of canonicals) {
            const dist = levenshtein(lower, c.value.toLowerCase());
            if (dist <= maxDistance && (!bestMatch || dist < bestMatch.dist)) {
              bestMatch = { value: c.value, dist };
            }
          }

          if (bestMatch) {
            normalized.push(bestMatch.value);
            changed = true;
            normalizations.push({ grant_number: project.grant_number, field, original: val, normalized: bestMatch.value, distance: bestMatch.dist });
          } else {
            normalized.push(val); // keep original
          }
        }

        // Deduplicate
        const deduped = [...new Set(normalized)];
        if (changed || deduped.length < normalized.length) {
          updates[field] = deduped;
        }
      }

      if (Object.keys(updates).length > 0) {
        updatedProjects.push({ grant_number: project.grant_number, updates });
        if (!dryRun) {
          await sb.from("projects").update(updates).eq("grant_number", project.grant_number);
        }
      }
    }

    return new Response(JSON.stringify({
      dry_run: dryRun,
      normalizations_found: normalizations.length,
      projects_affected: updatedProjects.length,
      normalizations,
      updated_projects: updatedProjects.map(p => p.grant_number),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("normalize-tags error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
