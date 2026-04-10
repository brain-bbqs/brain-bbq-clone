import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_NOTIFY_EMAIL = "dcaic-admin@brain-bbqs.org";

interface FailureInfo {
  email?: string;
  name?: string;
  errorReason: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

async function logAndNotifyFailure(
  supabaseAdmin: ReturnType<typeof createClient>,
  info: FailureInfo,
) {
  // 1. Log to auth_audit_log table
  try {
    await supabaseAdmin.from("auth_audit_log").insert({
      attempted_email: info.email || null,
      globus_name: info.name || null,
      error_reason: info.errorReason,
      ip_address: info.ipAddress || null,
      metadata: info.metadata || {},
    });
  } catch (e) {
    console.error("Failed to log auth failure:", e);
  }

  // 2. Send admin notification email via Supabase Auth admin API (magic-link style)
  //    We use a simple approach: invoke a separate edge function or send directly
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const timestamp = new Date().toISOString();
    const subject = `[BBQS] Failed Auth Attempt: ${info.errorReason}`;
    const body = [
      `<h2>Failed Authentication Attempt</h2>`,
      `<p><strong>Time:</strong> ${timestamp}</p>`,
      `<p><strong>Email:</strong> ${info.email || "unknown"}</p>`,
      `<p><strong>Globus Name:</strong> ${info.name || "unknown"}</p>`,
      `<p><strong>Error:</strong> ${info.errorReason}</p>`,
      `<p><strong>IP:</strong> ${info.ipAddress || "unknown"}</p>`,
      info.metadata
        ? `<p><strong>Details:</strong> <pre>${JSON.stringify(info.metadata, null, 2)}</pre></p>`
        : "",
    ].join("\n");

    // Use the auth-notify edge function for sending email
    await fetch(`${SUPABASE_URL}/functions/v1/auth-notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: ADMIN_NOTIFY_EMAIL,
        subject,
        html: body,
      }),
    });
  } catch (e) {
    console.error("Failed to send admin notification:", e);
  }
}

function getClientIp(req: Request): string | undefined {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const GLOBUS_CLIENT_ID = Deno.env.get("GLOBUS_CLIENT_ID")!;
  const GLOBUS_CLIENT_SECRET = Deno.env.get("GLOBUS_CLIENT_SECRET")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const url = new URL(req.url);
  const clientIp = getClientIp(req);

  try {
    // GET request = Globus callback (redirect from Globus after user auth)
    if (req.method === "GET") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");

      if (!code || !stateParam) {
        return new Response("Missing code or state", { status: 400 });
      }

      // Decode state to get the frontend redirect URI
      let frontendRedirect: string;
      try {
        const stateData = JSON.parse(atob(stateParam));
        frontendRedirect = stateData.redirect_uri;
      } catch {
        return new Response("Invalid state parameter", { status: 400 });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Helper to redirect with error and log/notify
      const errorRedirectAndNotify = async (
        errorCode: string,
        email?: string,
        name?: string,
        extra?: Record<string, unknown>,
      ) => {
        await logAndNotifyFailure(supabaseAdmin, {
          email,
          name,
          errorReason: errorCode,
          ipAddress: clientIp,
          metadata: extra,
        });
        const errorRedirect = new URL(frontendRedirect);
        errorRedirect.searchParams.set("globus_error", errorCode);
        return Response.redirect(errorRedirect.toString(), 302);
      };

      // The redirect_uri for token exchange must be THIS edge function URL
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/globus-auth`;

      // Exchange code for tokens
      const tokenRes = await fetch("https://auth.globus.org/v2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${GLOBUS_CLIENT_ID}:${GLOBUS_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: edgeFunctionUrl,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("Globus token error:", err);
        return await errorRedirectAndNotify("token_exchange_failed", undefined, undefined, { globus_error: err });
      }

      const tokens = await tokenRes.json();

      // Get user info from Globus
      const userinfoRes = await fetch("https://auth.globus.org/v2/oauth2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userinfoRes.ok) {
        return await errorRedirectAndNotify("userinfo_failed");
      }

      const userinfo = await userinfoRes.json();
      const email = userinfo.email;
      const name = userinfo.name || userinfo.preferred_username || "";

      if (!email) {
        return await errorRedirectAndNotify("no_email", undefined, name);
      }

      // Resolve the canonical email for this person.
      let canonicalEmail = email;
      const emailLower = email.toLowerCase();

      // Check if this email is a secondary_email for any investigator
      const { data: invBySecondary } = await supabaseAdmin
        .from("investigators")
        .select("email")
        .contains("secondary_emails", [emailLower])
        .maybeSingle();

      if (invBySecondary?.email) {
        canonicalEmail = invBySecondary.email;
        console.log(`Resolved secondary email ${email} → canonical ${canonicalEmail}`);
      } else {
        const { data: invByPrimary } = await supabaseAdmin
          .from("investigators")
          .select("email")
          .ilike("email", emailLower)
          .maybeSingle();
        if (invByPrimary?.email) {
          canonicalEmail = invByPrimary.email;
        }
      }

      // Check if user exists (by canonical email)
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === canonicalEmail.toLowerCase()
      );

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Validate: either the domain is allowed OR this person is a known consortium member
        const domain = canonicalEmail.split("@")[1]?.toLowerCase();
        const { data: allowedDomain } = await supabaseAdmin
          .from("allowed_domains")
          .select("domain")
          .eq("domain", domain)
          .maybeSingle();

        const { data: knownInvestigator } = await supabaseAdmin
          .from("investigators")
          .select("id")
          .or(`email.ilike.${emailLower},secondary_emails.cs.{${emailLower}}`)
          .maybeSingle();

        if (!allowedDomain && !knownInvestigator) {
          return await errorRedirectAndNotify("domain_not_allowed", email, name, {
            domain,
            globus_username: userinfo.preferred_username,
          });
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: canonicalEmail,
          email_confirm: true,
          user_metadata: { full_name: name },
        });

        if (createError) {
          console.error("Create user error:", createError);
          return await errorRedirectAndNotify("create_user_failed", email, name, {
            error: createError.message,
          });
        }
        userId = newUser.user.id;
      }

      // Generate magic link using canonical email
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: canonicalEmail,
        });

      if (linkError || !linkData) {
        console.error("Generate link error:", linkError);
        return await errorRedirectAndNotify("session_failed", email, name, {
          error: linkError?.message,
        });
      }

      // Redirect back to frontend with token_hash
      const successRedirect = new URL(frontendRedirect);
      successRedirect.searchParams.set("token_hash", linkData.properties.hashed_token);
      successRedirect.searchParams.set("globus_name", name);
      successRedirect.searchParams.set("globus_email", email);

      return Response.redirect(successRedirect.toString(), 302);
    }

    // POST request = login action (initiate Globus OAuth)
    const { action, redirect_uri } = await req.json();

    if (action === "login") {
      // Validate redirect_uri against allowlist to prevent open redirect
      const ALLOWED_REDIRECT_ORIGINS = [
        "https://brain-bbqs.org",
        "https://www.brain-bbqs.org",
        "https://brain-bbqs.github.io",
        "https://brain-bbq-clone.lovable.app",
        "http://localhost:",
      ];
      const isAllowedRedirect = redirect_uri && ALLOWED_REDIRECT_ORIGINS.some(
        (o: string) => redirect_uri.startsWith(o)
      ) || (redirect_uri && /^https:\/\/[a-z0-9-]+\.lovable\.app\//.test(redirect_uri));

      if (!isAllowedRedirect) {
        return new Response(JSON.stringify({ error: "Invalid redirect_uri" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/globus-auth`;
      const state = btoa(JSON.stringify({ redirect_uri }));

      const authUrl = new URL("https://auth.globus.org/v2/oauth2/authorize");
      authUrl.searchParams.set("client_id", GLOBUS_CLIENT_ID);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("redirect_uri", edgeFunctionUrl);
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("state", state);

      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Globus auth error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
