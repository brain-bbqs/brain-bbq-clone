import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, requireAuth } from "../_shared/auth.ts";

// Background batch runner — kicks off multi-hop harvest across many seed grants.
// Admin/curator only. Runs sequentially in the background via EdgeRuntime.waitUntil.

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const auth = await requireAuth(req, cors);
  if (auth.error) return auth.error;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Admin/curator gate
  const userId = (auth as any).user?.id;
  if (userId) {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const ok = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "curator");
    if (!ok) {
      return new Response(JSON.stringify({ error: "admin/curator only" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const filterPattern: string = body.pattern ?? "(R61|R34)";
  const mode: "multihop" | "depth2" = body.mode === "depth2" ? "depth2" : "multihop";
  const explicit: string[] | undefined = Array.isArray(body.grants) ? body.grants : undefined;

  let grantNumbers: string[] = [];
  if (explicit?.length) {
    grantNumbers = explicit;
  } else {
    const { data } = await supabase.from("grants").select("grant_number");
    grantNumbers = (data ?? [])
      .map((g: any) => g.grant_number as string)
      .filter((g) => new RegExp(filterPattern).test(g));
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const fnName = mode === "multihop" ? "harvest-grant-methods-multihop" : "harvest-grant-methods";
  const userAuthHeader = req.headers.get("Authorization")!; // forward caller's JWT

  // Background runner
  const run = async () => {
    const results: any[] = [];
    for (const g of grantNumbers) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
          method: "POST",
          headers: {
            "Authorization": userAuthHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ seedGrantNumber: g }),
        });
        const json = await res.json().catch(() => ({}));
        results.push({ grant: g, status: res.status, ...json });
        console.log(`[batch] ${g} → ${res.status} pubs=${json?.publications_extracted ?? 0}`);
      } catch (e) {
        console.error(`[batch] ${g} failed`, e);
        results.push({ grant: g, error: String(e) });
      }
    }
    console.log("[batch] complete", JSON.stringify({ total: results.length }));
  };

  // @ts-ignore EdgeRuntime is provided by Supabase Edge runtime
  if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(run());
  } else {
    run(); // fire and forget
  }

  return new Response(JSON.stringify({
    ok: true,
    mode,
    queued: grantNumbers.length,
    grants: grantNumbers,
    note: "Running in background. Watch Edge Function logs for progress; results land in grant_methods_evidence.",
  }), { headers: { ...cors, "Content-Type": "application/json" } });
});