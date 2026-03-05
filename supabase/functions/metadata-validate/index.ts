import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Validation protocol checks for proposed metadata changes.
 * Runs BIDS, NWB, and HED ontology alignment checks,
 * then returns pass/fail assessments per field.
 */

interface ProposedChange {
  field: string;
  values: string[];
}

interface ValidationCheck {
  protocol: string;
  field: string;
  status: "pass" | "warning" | "fail";
  message: string;
  suggestions?: string[];
}

// Known canonical terms per ontology standard
const BIDS_MODALITIES = new Set([
  "anat", "func", "dwi", "fmap", "perf", "eeg", "meg", "ieeg", "beh",
  "pet", "micr", "nirs", "motion",
]);

const BIDS_DATA_TYPES = new Set([
  "T1w", "T2w", "FLAIR", "bold", "sbref", "events", "physio", "stim",
  "channels", "electrodes", "coordsystem", "headshape", "photo",
  "asl", "dwi", "epi", "fieldmap", "magnitude", "phasediff",
]);

const NWB_NEURODATA_TYPES = new Set([
  "ElectricalSeries", "SpikeEventSeries", "LFP", "Units",
  "ImageSeries", "TwoPhotonSeries", "RoiResponseSeries",
  "BehavioralEvents", "BehavioralTimeSeries", "Position",
  "SpatialSeries", "OptogeneticSeries", "TimeIntervals",
  "DfOverF", "Fluorescence", "PlaneSegmentation",
  "ImagingPlane", "OpticalChannel", "Device",
]);

// Broad NWB approach/sensor keywords
const NWB_APPROACHES = new Set([
  "electrophysiology", "extracellular electrophysiology",
  "intracellular electrophysiology", "patch clamp",
  "calcium imaging", "two-photon imaging", "optogenetics",
  "behavior", "behavioral tracking", "eye tracking",
  "icephys", "ecephys", "ophys",
]);

// HED categories (Hierarchical Event Descriptors)
const HED_TOP_LEVEL = new Set([
  "Event", "Sensory-event", "Agent-action", "Action", "Agent",
  "Item", "Sensory-presentation", "Condition-variable",
  "Task", "Experiment-context", "Experiment-procedure",
  "Participant-response", "Data-property", "Informational-property",
]);

// Species standard names
const STANDARD_SPECIES: Record<string, string> = {
  "mouse": "Mus musculus",
  "mice": "Mus musculus",
  "rat": "Rattus norvegicus",
  "rats": "Rattus norvegicus",
  "zebrafish": "Danio rerio",
  "fruit fly": "Drosophila melanogaster",
  "drosophila": "Drosophila melanogaster",
  "macaque": "Macaca mulatta",
  "rhesus": "Macaca mulatta",
  "marmoset": "Callithrix jacchus",
  "human": "Homo sapiens",
  "c. elegans": "Caenorhabditis elegans",
  "nematode": "Caenorhabditis elegans",
};

function normalizeForLookup(term: string): string {
  return term.toLowerCase().trim().replace(/[-_]/g, " ");
}

function checkBidsAlignment(field: string, values: string[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (field === "produce_data_modality" || field === "produce_data_type") {
    for (const v of values) {
      const norm = normalizeForLookup(v);
      // Check if term loosely matches BIDS modalities or data types
      const bidsMatch = [...BIDS_MODALITIES, ...BIDS_DATA_TYPES].find(
        (b) => norm.includes(b.toLowerCase()) || b.toLowerCase().includes(norm)
      );
      if (bidsMatch) {
        checks.push({
          protocol: "BIDS",
          field,
          status: "pass",
          message: `"${v}" aligns with BIDS term "${bidsMatch}"`,
        });
      } else {
        // Not a failure — just not in BIDS vocabulary
        checks.push({
          protocol: "BIDS",
          field,
          status: "warning",
          message: `"${v}" has no direct BIDS equivalent. This is okay if it's domain-specific.`,
          suggestions: [...BIDS_MODALITIES].slice(0, 5),
        });
      }
    }
  }

  return checks;
}

function checkNwbAlignment(field: string, values: string[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (field === "use_approaches" || field === "use_sensors") {
    for (const v of values) {
      const norm = normalizeForLookup(v);
      const nwbMatch = [...NWB_APPROACHES].find(
        (n) => norm.includes(n) || n.includes(norm)
      );
      if (nwbMatch) {
        checks.push({
          protocol: "NWB",
          field,
          status: "pass",
          message: `"${v}" aligns with NWB approach "${nwbMatch}"`,
        });
      } else {
        checks.push({
          protocol: "NWB",
          field,
          status: "warning",
          message: `"${v}" is not in standard NWB approach vocabulary. Consider using a canonical name.`,
        });
      }
    }
  }

  if (field === "produce_data_type" || field === "produce_data_modality") {
    for (const v of values) {
      const norm = normalizeForLookup(v);
      const nwbType = [...NWB_NEURODATA_TYPES].find(
        (n) => norm.includes(n.toLowerCase()) || n.toLowerCase().includes(norm)
      );
      if (nwbType) {
        checks.push({
          protocol: "NWB",
          field,
          status: "pass",
          message: `"${v}" maps to NWB neurodata type "${nwbType}"`,
        });
      }
    }
  }

  return checks;
}

function checkHedAlignment(field: string, values: string[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (field === "use_analysis_types" || field === "keywords") {
    for (const v of values) {
      const norm = normalizeForLookup(v);
      const hedMatch = [...HED_TOP_LEVEL].find(
        (h) => norm.includes(h.toLowerCase()) || h.toLowerCase().includes(norm)
      );
      if (hedMatch) {
        checks.push({
          protocol: "HED",
          field,
          status: "pass",
          message: `"${v}" relates to HED category "${hedMatch}"`,
        });
      }
    }
  }

  return checks;
}

function checkSpeciesNaming(field: string, values: string[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (field === "study_species") {
    for (const v of values) {
      const norm = normalizeForLookup(v);
      // Check if it's already a scientific name
      const isScientific = /^[A-Z][a-z]+ [a-z]+/.test(v);
      if (isScientific) {
        checks.push({
          protocol: "Species Naming",
          field,
          status: "pass",
          message: `"${v}" uses proper binomial nomenclature`,
        });
      } else {
        // Check if we have a mapping
        const canonical = STANDARD_SPECIES[norm];
        if (canonical) {
          checks.push({
            protocol: "Species Naming",
            field,
            status: "warning",
            message: `"${v}" should use scientific name "${canonical}"`,
            suggestions: [canonical],
          });
        } else {
          checks.push({
            protocol: "Species Naming",
            field,
            status: "warning",
            message: `"${v}" — could not verify scientific naming. Consider using binomial nomenclature.`,
          });
        }
      }
    }
  }

  return checks;
}

function checkValueQuality(field: string, values: string[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  for (const v of values) {
    // Check for overly generic terms
    const generic = ["data", "analysis", "method", "thing", "stuff", "other", "misc", "various"];
    if (generic.includes(normalizeForLookup(v))) {
      checks.push({
        protocol: "Quality",
        field,
        status: "fail",
        message: `"${v}" is too generic. Please use a more specific term.`,
      });
    }

    // Check for very short values
    if (v.length <= 2) {
      checks.push({
        protocol: "Quality",
        field,
        status: "fail",
        message: `"${v}" is too short to be a meaningful metadata value.`,
      });
    }
  }

  return checks;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { changes } = (await req.json()) as {
      changes: ProposedChange[];
    };

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No changes provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allChecks: ValidationCheck[] = [];
    const protocols = ["BIDS", "NWB", "HED", "Species Naming", "Quality"];

    for (const change of changes) {
      const { field, values } = change;
      if (!values || values.length === 0) continue;

      // Run all protocol checks
      allChecks.push(...checkBidsAlignment(field, values));
      allChecks.push(...checkNwbAlignment(field, values));
      allChecks.push(...checkHedAlignment(field, values));
      allChecks.push(...checkSpeciesNaming(field, values));
      allChecks.push(...checkValueQuality(field, values));
    }

    // Summarize results
    const passCount = allChecks.filter((c) => c.status === "pass").length;
    const warnCount = allChecks.filter((c) => c.status === "warning").length;
    const failCount = allChecks.filter((c) => c.status === "fail").length;

    const overallStatus: "approved" | "needs_review" | "rejected" =
      failCount > 0 ? "rejected" : warnCount > 0 ? "needs_review" : "approved";

    // Group by protocol for display
    const byProtocol: Record<string, ValidationCheck[]> = {};
    for (const p of protocols) {
      const pChecks = allChecks.filter((c) => c.protocol === p);
      if (pChecks.length > 0) {
        byProtocol[p] = pChecks;
      }
    }

    return new Response(
      JSON.stringify({
        overall_status: overallStatus,
        summary: {
          total_checks: allChecks.length,
          passed: passCount,
          warnings: warnCount,
          failed: failCount,
        },
        protocols_run: Object.keys(byProtocol),
        checks: allChecks,
        by_protocol: byProtocol,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("metadata-validate error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
