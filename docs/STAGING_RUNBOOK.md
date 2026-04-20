# BBQS Staging Mirror — Setup Runbook

End-to-end steps to bring the HexStrike-targeted staging environment online.
You will perform every step in this doc; the AI scaffolded the code but cannot
click through Supabase / Globus / Lovable dashboards for you.

**Estimated time:** 30–45 min.

---

## 0. Prerequisites

- Admin access to the BBQS Supabase **organization** (so you can create a new project).
- Admin access to the Globus developers console (https://app.globus.org/settings/developers).
- Owner access to this Lovable project (so you can remix it).
- Owner access to the GitHub repo (so you can add Actions secrets).
- A Supabase **personal access token** — generate at https://supabase.com/dashboard/account/tokens. Save it; you'll paste it into GitHub secrets.

---

## 1. Create the staging Supabase project

1. https://supabase.com/dashboard → **New project**
2. Name: `bbqs-staging`
3. Region: same as prod (`vpexxhfpvghlejljwpvt`)
4. DB password: generate strong, save in your password manager
5. Wait for provisioning (~2 min)
6. Copy these values from **Settings → API**:
   - **Project Ref** (in URL: `https://<ref>.supabase.co`) → call this `<staging-ref>`
   - **anon / public key** → `<staging-anon-key>`
   - **service_role key** → `<staging-service-role-key>`

---

## 2. Configure staging Supabase secrets

In **Project Settings → Edge Functions → Secrets**, add:

| Name | Value |
|---|---|
| `STAGING_MODE` | `true` |
| `STAGING_SEED_TOKEN` | Generate a 32-char random string; save it. |
| `GLOBUS_CLIENT_ID` | (filled in step 4) |
| `GLOBUS_CLIENT_SECRET` | (filled in step 4) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
auto-injected — do **not** add them manually.

---

## 3. Apply migrations + create custom DB pieces

Run from your local machine (or via the GitHub Action — see step 7):

```bash
supabase login                                      # paste the access token from step 0
supabase link --project-ref <staging-ref>
supabase db push --linked --include-all             # applies every migration in supabase/migrations/
```

This creates the full schema (tables, functions, RLS policies, enums) in staging.

---

## 4. Register the staging Globus client

1. Go to https://app.globus.org/settings/developers
2. Choose **Add another project** (or reuse the BBQS project) → **Add an app** → **Register a thick client or script that will be installed and run by users on their devices** is **wrong**; pick **Register a portal, science gateway, or other application you host**.
3. App name: `BBQS Staging`
4. Redirects:
   - `https://bbqs-staging.lovable.app/auth/callback`
   - (later, if you publish to a custom domain, add it too)
5. Required scopes: same as prod app (`openid`, `profile`, `email`).
6. Click **Generate New Client Secret**. Copy both:
   - **Client UUID** → paste into staging Supabase secret `GLOBUS_CLIENT_ID`
   - **Client Secret** → paste into staging Supabase secret `GLOBUS_CLIENT_SECRET`

---

## 5. Remix this Lovable project for staging

1. In Lovable, click the project name (top-left) → **Settings** → **Remix this project**
2. Name the remix: `bbqs-staging`
3. Open the remixed project → **Project Settings → Environment** (or edit `.env` directly)
4. Replace these three values:
   ```
   VITE_SUPABASE_URL=https://<staging-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<staging-anon-key>
   VITE_SUPABASE_PROJECT_ID=<staging-ref>
   ```
5. **Publish** the remix → Lovable assigns it `https://bbqs-staging.lovable.app` (or similar — confirm the URL matches what you registered with Globus in step 4; if not, go update the Globus redirect URI).

---

## 6. Deploy the staging-only edge functions

These functions live in this same repo but only do anything when
`STAGING_MODE=true`. From your local clone of the **staging-linked** project:

```bash
supabase functions deploy seed-staging-fakes  --project-ref <staging-ref> --no-verify-jwt
supabase functions deploy staging-fake-login  --project-ref <staging-ref> --no-verify-jwt
```

(Or skip — the GitHub Action in step 7 deploys them automatically.)

---

## 7. Wire up the GitHub Action

In the **prod** GitHub repo (this one), go to **Settings → Secrets and variables → Actions**:

**Repository secrets:**

| Name | Value |
|---|---|
| `STAGING_SUPABASE_PROJECT_REF` | `<staging-ref>` |
| `STAGING_SUPABASE_ACCESS_TOKEN` | the personal access token from step 0 |
| `STAGING_SEED_FUNCTION_URL` | `https://<staging-ref>.supabase.co/functions/v1/seed-staging-fakes` |
| `STAGING_SEED_TOKEN` | the random string from step 2 |
| `STAGING_ANON_KEY` | `<staging-anon-key>` |

**Repository variables:**

| Name | Value |
|---|---|
| `STAGING_ENABLED` | `true` |

Then trigger the workflow manually: **Actions → Sync staging schema → Run workflow**.
First run takes ~2 min and ends with a JSON log showing the fake-data seed result.

---

## 8. Verify

```bash
# Get an admin JWT
curl -X POST "https://<staging-ref>.supabase.co/functions/v1/staging-fake-login" \
  -H "Authorization: Bearer <staging-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"user":"admin"}'
```

You should get back `{ access_token, refresh_token, user_id, email, role }`.
Use that `access_token` as a Bearer token for any subsequent HexStrike requests.

Also: open `https://bbqs-staging.lovable.app` in a browser, sign in via Globus
(your real Globus identity works — the staging Globus client accepts the same
identities), and confirm you see fake data only.

---

## 9. Re-snapshot prod row counts (quarterly)

When you want staging to grow with prod:

```sql
-- Run in prod Supabase SQL editor
SELECT
  (SELECT count(*) FROM investigators) AS investigators,
  (SELECT count(*) FROM grants)        AS grants,
  (SELECT count(*) FROM publications)  AS publications,
  (SELECT count(*) FROM organizations) AS organizations,
  (SELECT count(*) FROM jobs)          AS jobs,
  (SELECT count(*) FROM projects)      AS projects,
  (SELECT count(*) FROM software_tools) AS software_tools,
  (SELECT count(*) FROM species)       AS species,
  (SELECT count(*) FROM announcements) AS announcements,
  (SELECT count(*) FROM grant_investigators) AS grant_investigators,
  (SELECT count(*) FROM investigator_organizations) AS investigator_organizations,
  (SELECT count(*) FROM allowed_domains) AS allowed_domains,
  (SELECT count(*) FROM funding_opportunities) AS funding_opportunities;
```

Update `supabase/functions/seed-staging-fakes/prod-counts.json` and the inline
`PROD_COUNTS` constant in `index.ts`. Push to main → GitHub Action auto-reseeds.

---

## Troubleshooting

**`seed-staging-fakes` returns `STAGING_MODE not set`:**
You forgot step 2. Add the env var on the staging Supabase project, redeploy.

**`seed-staging-fakes` returns `Detected real-looking email`:**
The function refuses to wipe a database that looks like prod. Check that you're
pointed at the right project. If staging is genuinely empty, this won't fire.

**Globus redirect mismatch on staging login:**
The redirect URI registered in step 4 must exactly match
`https://<your-staging-host>/auth/callback`. Update it in the Globus
developers console.

**GitHub Action skipped:**
You forgot to set `STAGING_ENABLED=true` as a repo **variable** (not secret) in step 7.
