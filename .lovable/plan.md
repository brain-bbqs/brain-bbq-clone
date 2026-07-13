# Interactional Micro-Layer — Admin-Only Social Adhesion Instrumentation

Ethical frame (locked in, drives every design choice below):

- **Purpose is coordination, never evaluation.** Scores exist so admins can notice where the group is drifting apart and intervene — never to rank, fund, or judge any individual.
- **No consortium member ever sees a score about themselves or anyone else.** Not in the UI, not in an export, not via the API.
- **The existence of the research is itself confidential.** No page title, nav entry, tooltip, edge-function name, or public route hints that per-person psycholinguistic scoring is happening.
- Any future paper or public write-up uses aggregate consortium-level trends only, never per-person rows.

---

## 1. What we compute per investigator

From text they've already produced in BBQS (`grants.abstract`, `publications.abstract`, `entity_comments`, `feature_suggestions`; emails deferred to v2):

- **LIWC profile** — % of tokens per category (Linguistic, Psychological, Personal concerns, Spoken categories) from the four appendix pages. Also `words/sentence`, `avg_word_length`, `pct_words_>6_letters`, pronoun ratios.
- **Personality Score** (scalar, z-scored vs. consortium): combination of prosocial / open / cognitively-complex categories (Social processes, Positive emotion, Insight, Cognitive processes, Inclusive, Words>6 letters) minus (Negations, Inhibition, Anger). Weights live in `interactional_config` so admins can retune without a deploy.
- **Science Score** (scalar): pairwise cosine similarity of the investigator's TF-IDF science vector (grants + pubs only) against every other investigator's — reported as **mean similarity to the rest of the consortium**. No hub grant anchor; there is no "goal vector." This measures how vocabulary-connected each person is to the group as it currently is, which drifts as the group drifts.
- **Social Adhesion** = 0.5 · Personality + 0.5 · Science, again z-scored. Watched as a trend, no target value.

## 2. Storage — admin-only from the schema up

New tables under a **non-`public` schema** so PostgREST can't reach them even if someone forgets a policy:

```
CREATE SCHEMA IF NOT EXISTS internal_research;
```

Tables in `internal_research`:

- `interactional_profiles(investigator_id, liwc jsonb, personality_score, science_score, adhesion, token_count, last_computed_at)`
- `interactional_snapshots(id, investigator_id, personality_score, science_score, adhesion, snapshot_date)`
- `interactional_config(key, value jsonb)` — weights, source toggles.
- `interactional_queue(investigator_id, enqueued_at)` — debounce buffer.

Access rules:

- No `GRANT` to `anon` or `authenticated`. Only `service_role` and a dedicated admin role. Because the schema isn't in `db.schemas` for PostgREST, the tables are invisible to the JS client entirely — no RLS bypass surface to worry about.
- RLS still enabled on every table with a single `USING (public.has_role(auth.uid(), 'admin'))` policy as belt-and-braces.
- No foreign key from these tables into `public` tables (avoid leaking their existence through error messages on public queries). Use plain uuid columns and validate in the edge function.

## 3. Compute path

- Edge function `internal-research-worker` (deliberately generic name, no mention of the feature) reads the queue, computes profiles, writes to `internal_research.*`. Uses `SUPABASE_SERVICE_ROLE_KEY`.
- LIWC dictionary shipped as a JSON asset inside the edge function directory only — **not** exposed to the frontend bundle.
- Triggered by: (a) DB triggers on the four corpus tables that enqueue an investigator id via a `SECURITY DEFINER` function; (b) an admin-only manual "recompute" button; (c) nightly cron to write snapshots.
- No client ever calls this function. Invocation is admin-JWT-gated and additionally origin-checked.

## 4. UI — hidden by default

- New route `/internal/coordination` (no sidebar entry, no breadcrumb, no link from anywhere). Access = `useUserTier().isAdmin` only; anything less returns `NotFound` (404, not 403 — 403 signals "there's something here you can't see").
- `<PageMeta>` intentionally leaves `robots="noindex,nofollow"` and a neutral title ("Admin").
- No mention on `/social-force-field`. The public Social Force Field page continues to show only the layer diagrams and aggregate consortium metrics already planned — never a per-person value.
- Contents of `/internal/coordination`:
  1. Consortium roll-up: mean adhesion trend, vocabulary-cohesion trend, count of active contributors. Aggregates only.
  2. Investigator table (admins only): name, personality/science/adhesion, sparkline. Sortable. This is the operational surface.
  3. Drilldown drawer: LIWC radar, top contributing terms, source breakdown. Also admin-only.
- Every load of this page writes a row to `auth_audit_log` (`event='internal_research_view'`) so we know who looked and when.

## 5. What consortium members can see

Nothing new. The existing `/social-force-field` page keeps its current three-layer visualization with **only aggregate** numbers (consortium-level lexical alignment trend, novel-term birth rate, co-attention density). No per-person breakdown, no ranking table, no "your score."

## 6. Build order

1. Migration: `internal_research` schema + four tables + admin-only RLS + `SECURITY DEFINER` enqueue function. No GRANTs to `anon`/`authenticated`.
2. LIWC dictionary JSON inside `supabase/functions/internal-research-worker/dict/`.
3. Edge function `internal-research-worker` (compute + backfill mode).
4. DB triggers on `grants`, `publications`, `entity_comments`, `feature_suggestions` calling the enqueue function.
5. Route `/internal/coordination` gated behind `isAdmin`, with audit-log write on mount.
6. Nightly snapshot cron.

## 7. Explicit non-goals

- No per-person surfacing to non-admins under any circumstance.
- No email ingest yet — enable in v2 with the same admin-only gating and an explicit consent line in the consortium onboarding notice.
- No LLM-written personality descriptions in v1 (avoids inadvertently generating harsh characterizations of real people). Rules-based summary only.
- No export button. If an admin needs data, they run a query — friction is the point.

## Open questions

1. Should the audit log of who viewed `/internal/coordination` also be admin-only-visible, or visible to a smaller "oversight" subset (e.g., only the two named PIs of the coordination-core grant)? Recommend the latter for accountability — admins can see the data, but their access is watched by someone.
2. When (if ever) do we tell consortium members this instrumentation exists? Recommend a one-line addition to the internal data-use notice before we ingest emails, not before v1 ships.
3. OK to name the edge function `internal-research-worker` and the route `/internal/coordination`? Both are deliberately bland; happy to make them blander.
