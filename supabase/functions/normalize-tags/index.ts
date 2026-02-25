import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Levenshtein distance between two strings.
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
  produce_data_type: "data_type",
  use_analysis_method: "analysis_method",
  use_analysis_types: "analysis_type",
  develope_software_type: "software_type",
  develope_hardware_type: "hardware_type",
  keywords: "keyword",
};

// Minimum usage count before a custom value can be auto-promoted
const PROMOTION_THRESHOLD = 3;
// Max Levenshtein distance to consider a fuzzy match
const DEFAULT_MAX_DISTANCE = 2;
// Distance above which a value is considered truly novel (not a typo)
const NOVEL_THRESHOLD = 4;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const maxDistance = body.max_distance ?? DEFAULT_MAX_DISTANCE;
    const autoPromote = body.auto_promote !== false;

    // Fetch taxonomies
    const { data: taxonomies, error: taxErr } = await sb.from("taxonomies").select("*");
    if (taxErr) throw taxErr;

    // Fetch ontology standards for cross-referencing
    const { data: ontologies } = await sb.from("ontology_standards").select("*");

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
    const customFieldTracker = new Map<string, { field_name: string; field_value: string; category: string; count: number; closest: string | null; distance: number | null }>();

    for (const project of (projects || [])) {
      const updates: Record<string, string[]> = {};

      for (const [field, category] of Object.entries(FIELD_TO_CATEGORY)) {
        const values = (project as any)[field] as string[] | null;
        if (!values?.length) continue;

        const canonicals = canonicalByCategory.get(category) || [];
        const normalized: string[] = [];
        let changed = false;

        for (const val of values) {
          const lower = val.toLowerCase().trim();

          // Exact match
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
            normalized.push(val);

            // Track this as a custom/novel value
            const key = `${field}::${lower}`;
            const existing = customFieldTracker.get(key);
            
            // Find closest canonical for reference
            let closestCanonical: string | null = null;
            let closestDist: number | null = null;
            for (const c of canonicals) {
              const dist = levenshtein(lower, c.value.toLowerCase());
              if (closestDist === null || dist < closestDist) {
                closestDist = dist;
                closestCanonical = c.value;
              }
            }

            if (existing) {
              existing.count++;
            } else {
              customFieldTracker.set(key, {
                field_name: field,
                field_value: val,
                category,
                count: 1,
                closest: closestCanonical,
                distance: closestDist,
              });
            }
          }
        }

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

    // ---- Self-Autonomy: Track & promote custom fields ----
    const promotions: { field_value: string; category: string }[] = [];

    for (const [, entry] of customFieldTracker) {
      if (!dryRun) {
        // Upsert into custom_field_usage
        const { data: existing } = await sb
          .from("custom_field_usage")
          .select("id, usage_count")
          .eq("field_name", entry.field_name)
          .eq("field_value", entry.field_value)
          .maybeSingle();

        const newCount = (existing?.usage_count || 0) + entry.count;

        if (existing) {
          await sb.from("custom_field_usage").update({
            usage_count: newCount,
            closest_canonical: entry.closest,
            levenshtein_distance: entry.distance,
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await sb.from("custom_field_usage").insert({
            field_name: entry.field_name,
            field_value: entry.field_value,
            category: entry.category,
            usage_count: entry.count,
            closest_canonical: entry.closest,
            levenshtein_distance: entry.distance,
          });
        }

        // Auto-promote if usage exceeds threshold and it's truly novel
        if (autoPromote && newCount >= PROMOTION_THRESHOLD && (entry.distance === null || entry.distance >= NOVEL_THRESHOLD)) {
          // Check not already promoted
          const { data: alreadyPromoted } = await sb
            .from("custom_field_usage")
            .select("promoted")
            .eq("field_name", entry.field_name)
            .eq("field_value", entry.field_value)
            .maybeSingle();

          if (!alreadyPromoted?.promoted) {
            // Insert as new taxonomy value
            await sb.from("taxonomies").insert({
              category: entry.category,
              value: entry.field_value,
              label: entry.field_value,
              metadata: { auto_promoted: true, usage_count: newCount, source: "self_autonomy" },
            });

            await sb.from("custom_field_usage").update({
              promoted: true,
              promoted_at: new Date().toISOString(),
            }).eq("field_name", entry.field_name).eq("field_value", entry.field_value);

            promotions.push({ field_value: entry.field_value, category: entry.category });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      dry_run: dryRun,
      normalizations_found: normalizations.length,
      projects_affected: updatedProjects.length,
      normalizations,
      updated_projects: updatedProjects.map(p => p.grant_number),
      custom_fields_tracked: customFieldTracker.size,
      auto_promotions: promotions,
      ontologies_loaded: (ontologies || []).length,
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
