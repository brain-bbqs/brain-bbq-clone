import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuth } from "../_shared/auth.ts";

type Provider = "github" | "supabase" | "lovable";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { user, error } = await requireAuth(req, cors);
    if (error) return error;

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // Verify admin role
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
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
// Uses GITHUB_TOKEN. Requires admin:org for org endpoints, or read:user for user.
async function syncGithub(cfg: any): Promise<Array<Record<string, unknown>>> {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN secret missing");
  const owner: string | undefined = cfg.config?.org ?? cfg.config?.user;
  const ownerType: "orgs" | "users" = cfg.config?.user ? "users" : "orgs";
  if (!owner) throw new Error("Set GitHub org or user in config first");

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const endpoints = [
    { key: "actions", label: "GitHub Actions", url: `https://api.github.com/${ownerType}/${owner}/settings/billing/actions` },
    { key: "packages", label: "GitHub Packages", url: `https://api.github.com/${ownerType}/${owner}/settings/billing/packages` },
    { key: "storage", label: "Shared Storage", url: `https://api.github.com/${ownerType}/${owner}/settings/billing/shared-storage` },
  ];

  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const out: Array<Record<string, unknown>> = [];

  for (const ep of endpoints) {
    const res = await fetch(ep.url, { headers });
    if (!res.ok) {
      out.push({
        provider: "github", metric_key: `${ep.key}_error`, metric_label: ep.label,
        value_numeric: null, unit: null, period_start: periodStart, period_end: periodEnd,
        raw: { status: res.status, error: await res.text() },
      });
      continue;
    }
    const data = await res.json();
    // Most endpoints expose total_paid_minutes_used / estimated_paid_storage_for_month / etc.
    const usd =
      typeof data.total_paid_minutes_used === "number"
        ? (data.total_paid_minutes_used * 0.008) // approx Linux minute rate
        : typeof data.estimated_storage_for_month === "number"
        ? data.estimated_storage_for_month
        : null;
    out.push({
      provider: "github",
      metric_key: ep.key,
      metric_label: ep.label,
      value_numeric: usd,
      unit: "USD",
      period_start: periodStart,
      period_end: periodEnd,
      raw: data,
    });
  }
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
  const totalUsd = snapshots
    .filter((s) => s.unit === "USD" && typeof s.value_numeric === "number")
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