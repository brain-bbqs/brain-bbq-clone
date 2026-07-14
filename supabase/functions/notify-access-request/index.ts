// Notify admins when a NEW access request is filed.
//
// Invoked by the AFTER INSERT trigger on public.access_requests (migration
// 20260714130000_notify_new_access_request.sql) so it fires exactly ONCE per new
// pending request, REGARDLESS of how the request was created — the /request-access
// intake form, the upsert_access_request RPC, or the globus-auth failed-sign-in
// auto-file. Centralizing the notification at the DB layer is why a person who goes
// straight to the intake form (no Globus sign-in first, so globus-auth never runs)
// still generates an admin alert — the gap that let two real requests come in silently.
//
// verify_jwt = false (config.toml): this is a machine caller (pg_net), and the
// function only ever emails the FIXED admin address with a FIXED template built from
// the request row — it is not an open relay, so it needs no service-role gate.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_NOTIFY_TO = "noreply@brain-bbqs.org";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim();
    const institution = String(body.institution ?? "").trim();
    const requestedRole = String(body.requested_role ?? "").trim();
    const globusUsername = String(body.globus_username ?? "").trim();
    const adminUrl = String(
      body.admin_url ?? "https://brain-bbqs.org/admin?tab=access-requests",
    ).trim();

    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `[BBQS] Access requested — approval needed: ${name || email}`;
    const html = [
      `<h2>Access requested — approval needed</h2>`,
      `<p>A new BBQS access request is awaiting review.</p>`,
      `<p><strong>Name:</strong> ${esc(name) || "unknown"}</p>`,
      `<p><strong>Email:</strong> ${esc(email)}</p>`,
      institution ? `<p><strong>Institution:</strong> ${esc(institution)}</p>` : "",
      requestedRole ? `<p><strong>Requested role:</strong> ${esc(requestedRole)}</p>` : "",
      globusUsername ? `<p><strong>Globus username:</strong> ${esc(globusUsername)}</p>` : "",
      `<p><a href="${esc(adminUrl)}">Review &amp; approve in the admin console →</a></p>`,
      `<p style="color:#888;font-size:12px">If this is an existing member whose on-file email differs from the address above, add that address to their investigator record and they'll sign in automatically.</p>`,
    ].join("\n");

    console.log(`=== ACCESS REQUEST NOTIFICATION === TO: ${ADMIN_NOTIFY_TO} SUBJECT: ${subject}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — logging only");
      return new Response(JSON.stringify({ success: true, method: "logged" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BBQS <noreply@brain-bbqs.org>",
        to: [ADMIN_NOTIFY_TO],
        subject,
        html,
      }),
    });
    const resendData = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error("Resend error:", JSON.stringify(resendData));
      return new Response(JSON.stringify({ success: false, error: resendData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-access-request error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
