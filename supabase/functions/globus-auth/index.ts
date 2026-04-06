import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const GLOBUS_CLIENT_ID = Deno.env.get("GLOBUS_CLIENT_ID")!;
  const GLOBUS_CLIENT_SECRET = Deno.env.get("GLOBUS_CLIENT_SECRET")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const url = new URL(req.url);

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
        const errorRedirect = new URL(frontendRedirect);
        errorRedirect.searchParams.set("globus_error", "token_exchange_failed");
        return Response.redirect(errorRedirect.toString(), 302);
      }

      const tokens = await tokenRes.json();

      // Get user info from Globus
      const userinfoRes = await fetch("https://auth.globus.org/v2/oauth2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userinfoRes.ok) {
        const errorRedirect = new URL(frontendRedirect);
        errorRedirect.searchParams.set("globus_error", "userinfo_failed");
        return Response.redirect(errorRedirect.toString(), 302);
      }

      const userinfo = await userinfoRes.json();
      const email = userinfo.email;
      const name = userinfo.name || userinfo.preferred_username || "";

      if (!email) {
        const errorRedirect = new URL(frontendRedirect);
        errorRedirect.searchParams.set("globus_error", "no_email");
        return Response.redirect(errorRedirect.toString(), 302);
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Resolve the canonical email for this person.
      // If they logged in with a secondary email, find their primary email
      // so the Supabase auth account is always tied to the primary.
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
        // Also check if this email matches a primary investigator email
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

        // Also check if they're a known investigator (by any email)
        const { data: knownInvestigator } = await supabaseAdmin
          .from("investigators")
          .select("id")
          .or(`email.ilike.${emailLower},secondary_emails.cs.{${emailLower}}`)
          .maybeSingle();

        if (!allowedDomain && !knownInvestigator) {
          const errorRedirect = new URL(frontendRedirect);
          errorRedirect.searchParams.set("globus_error", "domain_not_allowed");
          return Response.redirect(errorRedirect.toString(), 302);
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: canonicalEmail,
          email_confirm: true,
          user_metadata: { full_name: name },
        });

        if (createError) {
          console.error("Create user error:", createError);
          const errorRedirect = new URL(frontendRedirect);
          errorRedirect.searchParams.set("globus_error", "create_user_failed");
          return Response.redirect(errorRedirect.toString(), 302);
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
        const errorRedirect = new URL(frontendRedirect);
        errorRedirect.searchParams.set("globus_error", "session_failed");
        return Response.redirect(errorRedirect.toString(), 302);
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
      // The redirect_uri for Globus must be THIS edge function (GET handler)
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/globus-auth`;

      // Encode the frontend redirect URI in the state parameter
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
