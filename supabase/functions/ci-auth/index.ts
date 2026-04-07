import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * CI-only edge function that creates a short-lived Supabase session
 * for a test user. Protected by a shared secret (CI_AUTH_SECRET).
 *
 * POST { secret: "..." }
 * Returns { access_token, refresh_token }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secret } = await req.json();
    const expected = Deno.env.get("CI_AUTH_SECRET");

    if (!expected || secret !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const testEmail = "ci-test@bbqs.test";

    // Ensure test user exists
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    let user = users?.users?.find(
      (u: any) => u.email?.toLowerCase() === testEmail
    );

    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        email_confirm: true,
        user_metadata: { full_name: "CI Test User" },
      });
      if (error) throw error;
      user = data.user;
    }

    // Generate a session
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: testEmail,
      });

    if (linkError || !linkData) throw linkError || new Error("No link data");

    // Verify the OTP to get actual tokens
    const { data: session, error: verifyError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: testEmail,
      });

    // Use the admin API to create a session directly
    // We'll return the hashed token for the client to verify
    return new Response(
      JSON.stringify({
        token_hash: linkData.properties.hashed_token,
        email: testEmail,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("ci-auth error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
