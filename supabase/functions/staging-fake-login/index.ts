/**
 * staging-fake-login
 *
 * STAGING-ONLY. Returns a Supabase access token for one of the fixed test users
 * created by `seed-staging-fakes`. Used by HexStrike (and any other pentest
 * tooling) to obtain authenticated JWTs without going through the Globus OAuth
 * dance.
 *
 * Refuses to run unless STAGING_MODE=true.
 *
 * Usage:
 *   POST /functions/v1/staging-fake-login
 *   Body: { "user": "admin" }   // one of: member | curator | admin | attacker
 *   Response: { access_token, refresh_token, user_id, email, role }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

const STAGING_TEST_PASSWORD = "bbqs-staging-test-password-do-not-use-in-prod";
const STAGING_DOMAIN = "staging.brain-bbqs.test";
const VALID_USERS = new Set(["member", "curator", "admin", "attacker"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (Deno.env.get("STAGING_MODE") !== "true") {
    return new Response(
      JSON.stringify({ error: "REFUSED", reason: "STAGING_MODE not set" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST required" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: { user?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const userKey = (body.user ?? "").trim().toLowerCase();
  if (!VALID_USERS.has(userKey)) {
    return new Response(
      JSON.stringify({
        error: "Invalid user",
        valid_users: [...VALID_USERS],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const email = `${userKey}@${STAGING_DOMAIN}`;

  // Use anon key to perform a real password sign-in so we get a valid JWT pair
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password: STAGING_TEST_PASSWORD,
  });

  if (error || !data.session) {
    return new Response(
      JSON.stringify({
        error: "Sign-in failed. Has seed-staging-fakes been run yet?",
        detail: error?.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user_id: data.user?.id,
      email,
      role: userKey,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
