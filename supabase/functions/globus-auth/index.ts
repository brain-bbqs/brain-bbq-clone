import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

  // Step 1: /globus-auth?action=login → redirect to Globus
  // Step 2: /globus-auth?action=callback&code=XXX → exchange code, create/sign-in user

  try {
    const { action, code, redirect_uri } = await getParams(req, url);

    if (action === "login") {
      // Build Globus authorization URL
      const authUrl = new URL("https://auth.globus.org/v2/oauth2/authorize");
      authUrl.searchParams.set("client_id", GLOBUS_CLIENT_ID);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("redirect_uri", redirect_uri);
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("access_type", "offline");

      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "callback") {
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
          redirect_uri,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("Globus token error:", err);
        return new Response(JSON.stringify({ error: "Token exchange failed", details: err }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenRes.json();

      // Get user info from Globus
      const userinfoRes = await fetch("https://auth.globus.org/v2/oauth2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userinfoRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to get user info" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userinfo = await userinfoRes.json();
      const email = userinfo.email;
      const name = userinfo.name || userinfo.preferred_username || "";

      if (!email) {
        return new Response(JSON.stringify({ error: "No email returned from Globus" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use Supabase admin to create or sign in user
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
          return new Response(
            JSON.stringify({ error: "Access restricted to consortium university emails" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: name },
        });

        if (createError) {
          console.error("Create user error:", createError);
          return new Response(JSON.stringify({ error: "Failed to create user account" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = newUser.user.id;
      }

      // Generate a magic link / session for the user
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

      if (linkError || !linkData) {
        console.error("Generate link error:", linkError);
        return new Response(JSON.stringify({ error: "Failed to generate session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract the token hash from the link
      const actionLink = new URL(linkData.properties.action_link);
      const token_hash = actionLink.searchParams.get("token_hash") || actionLink.hash;

      return new Response(
        JSON.stringify({
          token_hash: linkData.properties.hashed_token,
          email,
          name,
          user_id: userId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

async function getParams(req: Request, url: URL) {
  if (req.method === "POST") {
    const body = await req.json();
    return {
      action: body.action || "",
      code: body.code || "",
      redirect_uri: body.redirect_uri || "",
    };
  }
  return {
    action: url.searchParams.get("action") || "",
    code: url.searchParams.get("code") || "",
    redirect_uri: url.searchParams.get("redirect_uri") || "",
  };
}
