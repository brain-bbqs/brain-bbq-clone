import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuth } from "../_shared/auth.ts";

type Provider = "github" | "supabase" | "lovable";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // Allow internal/cron callers via shared secret, otherwise require admin user.
    const internalToken = req.headers.get("x-internal-token");
    const cronSecret = Deno.env.get("CI_AUTH_SECRET");
    const isInternal = !!cronSecret && internalToken === cronSecret;

    if (!isInternal) {
      const { user, error } = await requireAuth(req, cors);
      if (error) return error;
      const { data: roles } = await admin
        .from("user_roles").select("role").eq("user_id", user.id);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const requested: Provider[] = Array.isArray(body.providers)
      ? body.providers
      : ["github", "supabase", "lovable"];

    const results: Record<string, unknown> = {};

    const { data: configs } = await admin
      .from("budget_config").select("*").in("provider", requested);
    const cfgByProvider = new Map((configs ?? []).map((c) => [c.provider, c]));

    for (const provider of requested) {
      const cfg = cfgByProvider.get(provider);
      if (!cfg) { results[provider] = { skipped: "no config row" }; continue; }
      try {
        let snapshots: Array<Record<string, unknown>> = [];
        if (provider === "github") snapshots = await syncGithub(cfg);
        else if (provider === "lovable") snapshots = syncLovableManual(cfg);
        else if (provider === "supabase") snapshots = syncSupabasePlaceholder(cfg);

        if (snapshots.length) {
          const { error: insertErr } = await admin
            .from("budget_snapshots").insert(snapshots);
          if (insertErr) throw insertErr;
        }

        await admin.from("budget_config").update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: "ok",
          last_sync_error: null,
        }).eq("provider", provider);

        // Threshold check (sum of latest USD snapshots this period)
        await checkThreshold(admin, provider, cfg, snapshots);

        results[provider] = { ok: true, count: snapshots.length };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await admin.from("budget_config").update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: "error",
          last_sync_error: msg,
        }).eq("provider", provider);
        results[provider] = { ok: false, error: msg };
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

// ---- GitHub ----
// Uses GITHUB_TOKEN. Pulls enhanced billing (line items in USD) + legacy
// minutes/storage endpoints. Auto-detects owner (org first, then user) if missing.
async function syncGithub(cfg: any): Promise<Array<Record<string, unknown>>> {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN secret missing");

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Resolve owner + type
  let owner: string | undefined = cfg.config?.org ?? cfg.config?.user;
  let ownerType: "orgs" | "users" = cfg.config?.user ? "users" : "orgs";
  if (!owner) {
    const me = await fetch("https://api.github.com/user", { headers });
    if (!me.ok) throw new Error(`GitHub /user failed: ${me.status} ${await me.text()}`);
    const u = await me.json();
    owner = u.login;
    ownerType = "users";
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const periodStart = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const periodEnd = new Date(year, month, 0).toISOString().slice(0, 10);
  const out: Array<Record<string, unknown>> = [];

  // 1. Enhanced billing (orgs on enterprise/metered plans) — itemized USD.
  if (ownerType === "orgs") {
    const enhUrl = `https://api.github.com/organizations/${owner}/settings/billing/usage?year=${year}&month=${month}`;
    const enh = await fetch(enhUrl, { headers });
    if (enh.ok) {
      const data = await enh.json();
      const items: any[] = data.usageItems ?? [];
      // Aggregate by product
      const byProduct = new Map<string, number>();
      for (const it of items) {
        const p = it.product ?? "other";
        byProduct.set(p, (byProduct.get(p) ?? 0) + Number(it.netAmount ?? it.grossAmount ?? 0));
      }
      for (const [product, usd] of byProduct) {
        out.push({
          provider: "github",
          metric_key: `enhanced_${product.toLowerCase().replace(/\s+/g, "_")}`,
          metric_label: `${product} (billed)`,
          value_numeric: Number(usd.toFixed(4)),
          unit: "USD",
          period_start: periodStart, period_end: periodEnd,
          raw: { source: "enhanced-billing", product, items_count: items.filter(i => i.product === product).length },
        });
      }
      out.push({
        provider: "github",
        metric_key: "enhanced_total",
        metric_label: "Enhanced billing total",
        value_numeric: Number([...byProduct.values()].reduce((a, b) => a + b, 0).toFixed(2)),
        unit: "USD",
        period_start: periodStart, period_end: periodEnd,
        raw: { source: "enhanced-billing", products: [...byProduct.keys()] },
      });
    }
  }

  // 2. Legacy per-product endpoints (work on user accounts + classic org plans).
  const endpoints = [
    { key: "actions",  label: "GitHub Actions",  url: `https://api.github.com/${ownerType}/${owner}/settings/billing/actions` },
    { key: "packages", label: "GitHub Packages", url: `https://api.github.com/${ownerType}/${owner}/settings/billing/packages` },
    { key: "storage",  label: "Shared Storage",  url: `https://api.github.com/${ownerType}/${owner}/settings/billing/shared-storage` },
  ];

  for (const ep of endpoints) {
    const res = await fetch(ep.url, { headers });
    if (!res.ok) {
      out.push({
        provider: "github", metric_key: `${ep.key}_error`, metric_label: `${ep.label} (error)`,
        value_numeric: null, unit: null, period_start: periodStart, period_end: periodEnd,
        raw: { status: res.status, error: (await res.text()).slice(0, 500), endpoint: ep.url },
      });
      continue;
    }
    const data = await res.json();

    if (ep.key === "actions") {
      const totalMin = Number(data.total_minutes_used ?? 0);
      const paidMin = Number(data.total_paid_minutes_used ?? 0);
      const includedMin = Number(data.included_minutes ?? 0);
      out.push({
        provider: "github", metric_key: "actions_minutes_total", metric_label: "Actions minutes used",
        value_numeric: totalMin, unit: "minutes",
        period_start: periodStart, period_end: periodEnd, raw: data,
      });
      out.push({
        provider: "github", metric_key: "actions_minutes_included", metric_label: "Actions minutes included",
        value_numeric: includedMin, unit: "minutes",
        period_start: periodStart, period_end: periodEnd, raw: null,
      });
      out.push({
        provider: "github", metric_key: "actions_usd", metric_label: "Actions paid (est.)",
        value_numeric: Number((paidMin * 0.008).toFixed(2)), unit: "USD",
        period_start: periodStart, period_end: periodEnd, raw: null,
      });
    } else if (ep.key === "packages") {
      const gb = Number(data.total_gigabytes_bandwidth_used ?? 0);
      const paidGb = Number(data.total_paid_gigabytes_bandwidth_used ?? 0);
      out.push({
        provider: "github", metric_key: "packages_bandwidth_gb", metric_label: "Packages bandwidth (GB)",
        value_numeric: gb, unit: "GB",
        period_start: periodStart, period_end: periodEnd, raw: data,
      });
      out.push({
        provider: "github", metric_key: "packages_usd", metric_label: "Packages paid (est.)",
        value_numeric: Number((paidGb * 0.50).toFixed(2)), unit: "USD",
        period_start: periodStart, period_end: periodEnd, raw: null,
      });
    } else if (ep.key === "storage") {
      const days = Number(data.days_left_in_billing_cycle ?? 0);
      const estUsd = Number(data.estimated_storage_for_month ?? 0);
      const paidGb = Number(data.estimated_paid_storage_for_month ?? 0);
      out.push({
        provider: "github", metric_key: "storage_paid_gb_month", metric_label: "Storage paid (GB-month)",
        value_numeric: paidGb, unit: "GB-month",
        period_start: periodStart, period_end: periodEnd, raw: data,
      });
      out.push({
        provider: "github", metric_key: "storage_usd", metric_label: "Storage (est.)",
        value_numeric: estUsd, unit: "USD",
        period_start: periodStart, period_end: periodEnd,
        raw: { days_left_in_billing_cycle: days },
      });
    }
  }

  out.push({
    provider: "github", metric_key: "_owner", metric_label: `Owner: ${owner} (${ownerType})`,
    value_numeric: null, unit: null,
    period_start: periodStart, period_end: periodEnd,
    raw: { owner, ownerType },
  });

  return out;
}

// ---- Lovable (manual entry) ----
function syncLovableManual(cfg: any): Array<Record<string, unknown>> {
  if (cfg.manual_usage_usd == null) return [];
  const today = new Date();
  return [{
    provider: "lovable",
    metric_key: "manual_total",
    metric_label: "Manual total (credits + Cloud + AI)",
    value_numeric: cfg.manual_usage_usd,
    unit: "USD",
    period_start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
    period_end: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
    raw: { source: "manual", notes: cfg.manual_notes ?? null },
  }];
}

// ---- Supabase (placeholder until Management token is added) ----
function syncSupabasePlaceholder(cfg: any): Array<Record<string, unknown>> {
  const token = Deno.env.get("SUPABASE_MANAGEMENT_TOKEN");
  if (!token) {
    // Allow manual fallback identical to Lovable
    if (cfg.manual_usage_usd == null) return [];
    const today = new Date();
    return [{
      provider: "supabase",
      metric_key: "manual_total",
      metric_label: "Manual Supabase total",
      value_numeric: cfg.manual_usage_usd,
      unit: "USD",
      period_start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
      period_end: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
      raw: { source: "manual" },
    }];
  }
  return []; // Real Management API wiring lands when token is added.
}

// ---- Threshold → system_alerts ----
async function checkThreshold(
  admin: any, provider: Provider, cfg: any, snapshots: Array<Record<string, unknown>>,
) {
  if (!cfg.monthly_limit_usd || cfg.monthly_limit_usd <= 0) return;
  // Avoid double-counting: prefer enhanced_total when present; otherwise sum the per-product USD lines.
  const usdSnaps = snapshots.filter(
    (s) => s.unit === "USD" && typeof s.value_numeric === "number",
  );
  const enhanced = usdSnaps.find((s) => s.metric_key === "enhanced_total");
  const totalUsd = enhanced
    ? Number(enhanced.value_numeric)
    : usdSnaps
        .filter((s) => !String(s.metric_key).startsWith("enhanced_"))
        .reduce((sum, s) => sum + (s.value_numeric as number), 0);
  if (totalUsd <= 0) return;

  const pct = (totalUsd / Number(cfg.monthly_limit_usd)) * 100;
  const threshold = cfg.alert_threshold_pct ?? 80;
  if (pct < threshold) return;

  const severity = pct >= 100 ? "critical" : "warning";
  const period = new Date().toISOString().slice(0, 7);
  const fingerprint = `budget:${provider}:${period}:${severity}`;
  await admin.from("system_alerts").upsert({
    fingerprint,
    source: "budget-sync",
    severity,
    error_code: `BUDGET_${severity.toUpperCase()}`,
    message: `${provider} usage at ${pct.toFixed(1)}% of $${cfg.monthly_limit_usd} monthly cap`,
    details: { provider, total_usd: totalUsd, limit_usd: cfg.monthly_limit_usd, pct },
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "fingerprint" });
}