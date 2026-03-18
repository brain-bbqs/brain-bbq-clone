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

      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Validate domain against allowed_domains
        const domain = email.split("@")[1]?.toLowerCase();
        const { data: allowedDomain } = await supabaseAdmin
          .from("allowed_domains")
          .select("domain")
          .eq("domain", domain)
          .maybeSingle();

        if (!allowedDomain) {
          const errorRedirect = new URL(frontendRedirect);
          errorRedirect.searchParams.set("globus_error", "domain_not_allowed");
          return Response.redirect(errorRedirect.toString(), 302);
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
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

      // Generate magic link
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
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
