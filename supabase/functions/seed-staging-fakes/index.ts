/**
 * seed-staging-fakes
 *
 * STAGING-ONLY function. Refuses to run unless STAGING_MODE=true env var is set
 * on the Supabase project.
 *
 * Wipes and re-seeds all consortium tables with anonymized faker data matching
 * production row counts (see prod-counts.json). Also creates 5 fixed test users
 * for HexStrike pentesting:
 *
 *   - member@staging.brain-bbqs.test       (linked investigator, role=member)
 *   - curator@staging.brain-bbqs.test      (role=curator)
 *   - admin@staging.brain-bbqs.test        (role=admin)
 *   - attacker@staging.brain-bbqs.test     (role=member, unlinked, used for IDOR tests)
 *   - (anon = no account; just don't send a JWT)
 *
 * All test users use password: bbqs-staging-test-password-do-not-use-in-prod
 *
 * Deploy with: supabase functions deploy seed-staging-fakes
 * Invoke from CI: POST https://<staging-ref>.supabase.co/functions/v1/seed-staging-fakes
 *                 with header: x-seed-token: <STAGING_SEED_TOKEN>
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { faker } from "https://esm.sh/@faker-js/faker@8.4.1";
import { corsHeaders } from "../_shared/auth.ts";

const STAGING_TEST_PASSWORD = "bbqs-staging-test-password-do-not-use-in-prod";
const STAGING_DOMAIN = "staging.brain-bbqs.test";

const TEST_USERS = [
  { email: `member@${STAGING_DOMAIN}`,   role: "member"  as const, linked: true  },
  { email: `curator@${STAGING_DOMAIN}`,  role: "curator" as const, linked: true  },
  { email: `admin@${STAGING_DOMAIN}`,    role: "admin"   as const, linked: true  },
  { email: `attacker@${STAGING_DOMAIN}`, role: "member"  as const, linked: false },
];

interface ProdCounts {
  investigators: number;
  grants: number;
  publications: number;
  organizations: number;
  jobs: number;
  projects: number;
  software_tools: number;
  species: number;
  announcements: number;
  grant_investigators: number;
  investigator_organizations: number;
  allowed_domains: number;
  funding_opportunities: number;
}

const PROD_COUNTS: ProdCounts = {
  investigators: 228, grants: 30, publications: 45, organizations: 35,
  jobs: 4, projects: 30, software_tools: 18, species: 14,
  announcements: 10, grant_investigators: 76, investigator_organizations: 83,
  allowed_domains: 27, funding_opportunities: 6,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── Safety gate 1: STAGING_MODE must be true ──
  if (Deno.env.get("STAGING_MODE") !== "true") {
    return new Response(
      JSON.stringify({
        error: "REFUSED",
        reason: "STAGING_MODE env var is not 'true'. This function will not run on prod.",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Safety gate 2: shared seed token (prevents random callers) ──
  const expectedToken = Deno.env.get("STAGING_SEED_TOKEN");
  const providedToken = req.headers.get("x-seed-token");
  if (!expectedToken || providedToken !== expectedToken) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing x-seed-token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── Safety gate 3: scan investigators for real institutional emails ──
  const { data: existingInv } = await supabase
    .from("investigators")
    .select("email")
    .not("email", "is", null)
    .limit(50);
  const realDomainHit = (existingInv ?? []).find((r: any) => {
    const d = (r.email ?? "").split("@")[1] ?? "";
    return d && d !== STAGING_DOMAIN && !d.endsWith(".test") && !d.endsWith(".example");
  });
  if (realDomainHit) {
    return new Response(
      JSON.stringify({
        error: "REFUSED",
        reason: `Detected real-looking email '${realDomainHit.email}' in investigators table. This database may be production. Aborting to prevent data loss.`,
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  faker.seed(42); // deterministic
  const log: string[] = [];
  const startedAt = Date.now();

  try {
    // ── 1. Wipe (in dependency order) ──
    log.push("Wiping fake data…");
    const wipeOrder = [
      "grant_investigators", "investigator_organizations",
      "project_publications", "project_resources",
      "edit_history", "announcements", "jobs",
      "projects", "grants", "publications", "software_tools", "species",
      "investigators", "organizations", "allowed_domains", "funding_opportunities",
    ];
    for (const t of wipeOrder) {
      await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }

    // ── 2. Allowed domains ──
    log.push("Seeding allowed_domains…");
    const orgRows: any[] = Array.from({ length: PROD_COUNTS.organizations }, () => ({
      name: faker.company.name() + " University",
      url: faker.internet.url(),
    }));
    const { data: orgs } = await supabase.from("organizations").insert(orgRows).select("id");
    const orgIds = (orgs ?? []).map((o: any) => o.id);

    const domainRows = orgIds.slice(0, PROD_COUNTS.allowed_domains).map((id: string, i: number) => ({
      organization_id: id,
      domain: `fake${i}.${STAGING_DOMAIN}`,
    }));
    await supabase.from("allowed_domains").insert(domainRows);

    // ── 3. Investigators ──
    log.push("Seeding investigators…");
    const invRows = Array.from({ length: PROD_COUNTS.investigators }, (_, i) => ({
      name: faker.person.fullName(),
      email: `inv${i}@${STAGING_DOMAIN}`,
      orcid: `0000-0000-0000-${String(i).padStart(4, "0")}`,
      research_areas: faker.helpers.arrayElements(
        ["systems neuroscience", "behavior", "imaging", "ML", "genetics", "ephys"],
        { min: 1, max: 3 },
      ),
    }));
    const { data: invs } = await supabase.from("investigators").insert(invRows).select("id");
    const invIds = (invs ?? []).map((i: any) => i.id);

    // ── 4. investigator_organizations ──
    log.push("Linking investigators ↔ organizations…");
    const ioRows = Array.from({ length: PROD_COUNTS.investigator_organizations }, () => ({
      investigator_id: faker.helpers.arrayElement(invIds),
      organization_id: faker.helpers.arrayElement(orgIds),
    }));
    // Dedupe (composite PK)
    const ioUniq = Array.from(
      new Map(ioRows.map((r) => [`${r.investigator_id}-${r.organization_id}`, r])).values(),
    );
    await supabase.from("investigator_organizations").insert(ioUniq);

    // ── 5. Grants ──
    log.push("Seeding grants…");
    const grantRows = Array.from({ length: PROD_COUNTS.grants }, (_, i) => ({
      grant_number: `1R01FAKE${String(i).padStart(6, "0")}`,
      title: faker.lorem.sentence({ min: 6, max: 12 }),
      abstract: faker.lorem.paragraphs(2),
      award_amount: faker.number.int({ min: 100_000, max: 5_000_000 }),
      fiscal_year: faker.helpers.arrayElement([2023, 2024, 2025]),
    }));
    const { data: grants } = await supabase.from("grants").insert(grantRows).select("id, grant_number");
    const grantIds = (grants ?? []).map((g: any) => g.id);

    // ── 6. grant_investigators ──
    log.push("Linking grants ↔ investigators…");
    const giRows = Array.from({ length: PROD_COUNTS.grant_investigators }, () => ({
      grant_id: faker.helpers.arrayElement(grantIds),
      investigator_id: faker.helpers.arrayElement(invIds),
      role: faker.helpers.arrayElement(["pi", "co_pi", "co_investigator"]),
    }));
    const giUniq = Array.from(
      new Map(giRows.map((r) => [`${r.grant_id}-${r.investigator_id}`, r])).values(),
    );
    await supabase.from("grant_investigators").insert(giUniq);

    // ── 7. Projects ──
    log.push("Seeding projects…");
    const projRows = (grants ?? []).slice(0, PROD_COUNTS.projects).map((g: any) => ({
      grant_id: g.id,
      grant_number: g.grant_number,
      study_human: faker.datatype.boolean(),
      study_species: faker.helpers.arrayElements(["mouse", "rat", "macaque", "human", "zebrafish"], { min: 1, max: 2 }),
      keywords: faker.helpers.arrayElements(["calcium imaging", "behavior", "RNA-seq", "MRI", "ephys"], { min: 1, max: 4 }),
      website: faker.internet.url(),
    }));
    await supabase.from("projects").insert(projRows);

    // ── 8. Publications ──
    log.push("Seeding publications…");
    const pubRows = Array.from({ length: PROD_COUNTS.publications }, (_, i) => ({
      title: faker.lorem.sentence(),
      authors: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => faker.person.fullName()).join(", "),
      journal: faker.helpers.arrayElement(["Nature", "Cell", "Neuron", "Science", "eLife"]),
      year: faker.number.int({ min: 2020, max: 2025 }),
      pmid: String(30_000_000 + i),
      doi: `10.1234/fake.${i}`,
      citations: faker.number.int({ min: 0, max: 200 }),
    }));
    await supabase.from("publications").insert(pubRows);

    // ── 9. Software / species / jobs / announcements / funding ──
    log.push("Seeding software_tools, species, jobs, announcements, funding…");
    await supabase.from("software_tools").insert(
      Array.from({ length: PROD_COUNTS.software_tools }, () => ({
        name: faker.hacker.noun() + "-" + faker.string.alphanumeric(4),
        description: faker.lorem.sentence(),
        repo_url: faker.internet.url(),
        language: faker.helpers.arrayElement(["Python", "R", "MATLAB", "Julia"]),
        license: faker.helpers.arrayElement(["MIT", "Apache-2.0", "GPL-3.0", "BSD-3"]),
      })),
    );
    await supabase.from("species").insert(
      Array.from({ length: PROD_COUNTS.species }, () => ({
        name: faker.science.unit().name + " " + faker.animal.type(),
        common_name: faker.animal.type(),
        taxonomy_class: "Mammalia",
      })),
    );
    await supabase.from("jobs").insert(
      Array.from({ length: PROD_COUNTS.jobs }, () => ({
        title: faker.person.jobTitle(),
        institution: faker.company.name(),
        location: faker.location.city(),
        job_type: faker.helpers.arrayElement(["postdoc", "phd", "research_scientist"]),
        description: faker.lorem.paragraph(),
        is_active: true,
      })),
    );
    await supabase.from("announcements").insert(
      Array.from({ length: PROD_COUNTS.announcements }, () => ({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
      })),
    );
    await supabase.from("funding_opportunities").insert(
      Array.from({ length: PROD_COUNTS.funding_opportunities }, (_, i) => ({
        fon: `RFA-FAKE-${String(i).padStart(3, "0")}`,
        title: faker.lorem.sentence(),
        purpose: faker.lorem.paragraph(),
        status: "open",
      })),
    );

    // ── 10. Test users ──
    log.push("Creating fixed test users…");
    for (const u of TEST_USERS) {
      // Try create; if exists, skip
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: STAGING_TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: `Test ${u.role}` },
      });
      let userId = created?.user?.id;
      if (createErr && !userId) {
        // Already exists — look it up
        const { data: list } = await supabase.auth.admin.listUsers();
        userId = list?.users.find((x: any) => x.email === u.email)?.id;
      }
      if (!userId) { log.push(`  ⚠ failed to create ${u.email}`); continue; }

      // Role
      await supabase.from("user_roles").upsert(
        { user_id: userId, role: u.role },
        { onConflict: "user_id,role" },
      );

      // Link to an investigator if requested
      if (u.linked && invIds.length > 0) {
        await supabase
          .from("investigators")
          .update({ user_id: userId, email: u.email })
          .eq("id", invIds[TEST_USERS.indexOf(u)]);
      }
      log.push(`  ✓ ${u.email} (${u.role})`);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    log.push(`Done in ${elapsed}s`);

    return new Response(
      JSON.stringify({ ok: true, elapsed_seconds: Number(elapsed), log }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    log.push(`ERROR: ${(err as Error).message}`);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message, log }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
