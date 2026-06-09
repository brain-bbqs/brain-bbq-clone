import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/auth.ts";

/**
 * harvester-tick — cron-driven worker. Picks the next eligible seed from
 * harvester_queue (respecting cool_down + enabled) and invokes
 * harvest-grant-methods-multihop on it. Runs at most one seed per tick to
 * stay friendly to Firecrawl rate limits.
 */
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const jsonHeaders = { ...cors, "Content-Type": "application/json" };
  let body: any = {};
  try { body = await req.json(); } catch { /* GET / cron has no body */ }
  const force: boolean = !!body?.force;
  const explicitSeed: string | undefined = body?.seedGrantNumber;
  const source: string = String(body?.source ?? body?.trigger ?? "tick");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Global kill switch via harvester_settings.batch_paused (graceful if column missing)
  const { data: settings } = await supabase.from("harvester_settings").select("*").eq("id", 1).single();
  if (settings?.batch_paused) {
    return new Response(JSON.stringify({ ok: true, skipped: "paused" }), { headers: jsonHeaders });
  }

  // Don't start a new run if one is currently active (unless forced)
  if (!force) {
    const { count: active } = await supabase
      .from("harvester_runs")
      .select("id", { head: true, count: "exact" })
      .in("phase", ["queued", "scraping", "extracting", "hopping"]);
    if ((active ?? 0) > 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "run_in_progress", active }), { headers: jsonHeaders });
    }
  }

  // Pick next seed
  const { data: queue } = await supabase
    .from("harvester_queue")
    .select("*")
    .eq("enabled", true)
    .order("priority", { ascending: true })
    .order("last_run_at", { ascending: true, nullsFirst: true })
    .limit(20);

  let next: any = null;
  if (explicitSeed) {
    next = (queue ?? []).find((q: any) => q.seed_grant === explicitSeed)
         ?? { id: null, seed_grant: explicitSeed };
  } else if (force) {
    // Force: pick the oldest seed regardless of cool_down
    next = (queue ?? [])[0] ?? null;
  } else {
    const now = Date.now();
    next = (queue ?? []).find((q: any) => {
      if (!q.last_run_at) return true;
      const cd = (q.cool_down_hours ?? 72) * 3600 * 1000;
      return now - new Date(q.last_run_at).getTime() >= cd;
    });
  }

  if (!next) {
    return new Response(JSON.stringify({
      ok: true,
      skipped: "no_eligible_seed",
      reason: "All enabled seeds are inside their cooldown window. Use Force run for setup, or wait for the daily refresh.",
    }), { headers: jsonHeaders });
  }

  const { data: runRow, error: runError } = await supabase.from("harvester_runs").insert({
    seed_grant: next.seed_grant,
    phase: "queued",
    last_message: `Queued by ${source}${force ? " (forced)" : ""}`,
  }).select("id").single();
  if (runError || !runRow?.id) {
    return new Response(JSON.stringify({ ok: false, error: runError?.message ?? "failed to create run" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  // Mark last_run_at immediately (optimistic — prevents re-fire on next tick if invoke is slow)
  if (next.id) {
    await supabase.from("harvester_queue").update({
      last_run_at: new Date().toISOString(),
      last_run_id: runRow.id,
    }).eq("id", next.id);
  }

  // Fire and forget — call the multihop function
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/harvest-grant-methods-multihop`;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const invoke = fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, apikey: key },
    body: JSON.stringify({ seedGrantNumber: next.seed_grant, runId: runRow.id, source }),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await supabase.from("harvester_runs").update({
        phase: "error",
        errors: 1,
        last_message: `Harvest invoke failed ${res.status}: ${text.slice(0, 220)}`,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", runRow.id);
      if (next.id) await supabase.from("harvester_queue").update({ last_run_at: null }).eq("id", next.id);
    }
  }).catch(async (e) => {
    console.error("[tick] invoke failed", e);
    await supabase.from("harvester_runs").update({
      phase: "error",
      errors: 1,
      last_message: `Harvest invoke failed: ${String(e).slice(0, 220)}`,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", runRow.id);
    if (next.id) await supabase.from("harvester_queue").update({ last_run_at: null }).eq("id", next.id);
  });
  (globalThis as any).EdgeRuntime?.waitUntil?.(invoke);

  return new Response(JSON.stringify({ ok: true, kicked: next.seed_grant, forced: force, run_id: runRow.id }), {
    headers: jsonHeaders,
  });
});