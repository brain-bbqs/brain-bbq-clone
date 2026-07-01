import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/auth.ts";

/**
 * device-manuals-discovery — enriches `device_models` rows that don't have
 * manual_urls yet. Two sources:
 *   1. Firecrawl map of the manufacturer's domain, filtered for
 *      /manual|datasheet|IFU|user[-_ ]?guide|instructions/i and .pdf
 *   2. openFDA 510(k)/PMA for clinical devices (DBS, iEEG, sEEG grids)
 *
 * Idempotent: skips models that already have >=1 manual URL. Cheap: caps at
 * `?limit=N` per invocation (default 5) so it won't blow the Firecrawl budget.
 */

const FIRECRAWL_MAP = "https://api.firecrawl.dev/v2/map";
const OPENFDA = "https://api.fda.gov/device/510k.json";

const CLINICAL_CLASSES = new Set([
  "iEEG_clinical", "sEEG_clinical", "DBS_clinical", "EEG_scalp", "MEG",
]);

const KNOWN_DOMAINS: Record<string, string> = {
  "inscopix": "https://www.inscopix.com",
  "imec": "https://www.imec-int.com",
  "neuropixels": "https://www.neuropixels.org",
  "open ephys": "https://open-ephys.org",
  "open-ephys": "https://open-ephys.org",
  "medtronic": "https://www.medtronic.com",
  "ad-tech": "https://adtechmedical.com",
  "blackrock neurotech": "https://blackrockneurotech.com",
  "blackrock microsystems": "https://blackrockneurotech.com",
  "neuralynx": "https://neuralynx.com",
  "pmt corp": "https://www.pmtcorp.com",
  "pmt corporation": "https://www.pmtcorp.com",
  "dixi medical": "https://www.diximedical.com",
  "boston scientific": "https://www.bostonscientific.com",
  "abbott": "https://www.abbott.com",
};

function guessDomain(name: string): string | null {
  const key = name.toLowerCase().trim();
  if (KNOWN_DOMAINS[key]) return KNOWN_DOMAINS[key];
  for (const [k, v] of Object.entries(KNOWN_DOMAINS)) {
    if (key.includes(k)) return v;
  }
  return null;
}

async function firecrawlManualPdfs(domain: string, model: string): Promise<string[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch(FIRECRAWL_MAP, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: domain, search: `${model} manual`, limit: 40 }),
    });
    if (!res.ok) return [];
    const j = await res.json();
    const links: string[] = (j?.links || j?.data?.links || []).map((l: any) => (typeof l === "string" ? l : l?.url)).filter(Boolean);
    const rx = /manual|datasheet|IFU|user[-_ ]?guide|instructions|spec[-_ ]?sheet/i;
    return links.filter((u) => rx.test(u) || u.toLowerCase().endsWith(".pdf")).slice(0, 5);
  } catch (e) {
    console.error("firecrawl map failed", e);
    return [];
  }
}

async function openFdaManualUrls(manufacturer: string, model: string): Promise<string[]> {
  try {
    const q = `applicant:"${manufacturer.replace(/"/g, "")}"+AND+device_name:"${model.replace(/"/g, "")}"`;
    const res = await fetch(`${OPENFDA}?search=${encodeURIComponent(q)}&limit=3`);
    if (!res.ok) return [];
    const j = await res.json();
    const out: string[] = [];
    for (const r of j?.results || []) {
      if (r?.k_number) out.push(`https://www.accessdata.fda.gov/cdrh_docs/pdf/${r.k_number}.pdf`);
    }
    return out.slice(0, 3);
  } catch (e) {
    console.error("openfda failed", e);
    return [];
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = { ...cors, "Content-Type": "application/json" };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const limit = Math.min(20, Number(url.searchParams.get("limit") || 5));

  const { data: models, error } = await supabase
    .from("device_models")
    .select("id,model_name,device_class,manual_urls,manufacturer_id,device_manufacturers(name)")
    .or("manual_urls.is.null,manual_urls.eq.{}")
    .limit(limit);

  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: json });

  const results: any[] = [];

  for (const m of models || []) {
    const mfrName: string | undefined = (m as any).device_manufacturers?.name;
    const domain = mfrName ? guessDomain(mfrName) : null;

    const urls = new Set<string>();
    if (domain) {
      for (const u of await firecrawlManualPdfs(domain, m.model_name)) urls.add(u);
    }
    if (CLINICAL_CLASSES.has(m.device_class) && mfrName) {
      for (const u of await openFdaManualUrls(mfrName, m.model_name)) urls.add(u);
    }

    if (urls.size) {
      await supabase.from("device_models").update({
        manual_urls: Array.from(urls),
        last_verified_at: new Date().toISOString(),
      }).eq("id", m.id);
    }

    results.push({ id: m.id, model: m.model_name, manufacturer: mfrName, found: urls.size });
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), { headers: json });
});