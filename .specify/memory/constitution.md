# BBQS Agent Constitution

The BBQS Agent is the consortium "brain" for the Brain Behavior Quantification &
Synchronization (BBQS) consortium: a multi-persona assistant that automates
onboarding/offboarding, answers scientific and data questions over the BBQS
Knowledge Graph (KG), and proposes governed changes to upstream systems (KG,
Google Workspace, Slack, email). It replaces manual coordinator work without
removing human judgment from consequential actions.

This constitution defines the non-negotiable principles that every spec, plan,
and implementation MUST satisfy. It supersedes convenience and "vibe coding."

## Core Principles

### I. Human-in-the-Loop for All External Writes

Every mutation that leaves the agent's own database — KG row writes, Google Group
membership, emails, Slack invites — MUST be created as a reviewable proposal
in the `pending_writes` queue and applied only by an authenticated human action,
EXCEPT low-risk own-data writes explicitly flagged `autoApply` (e.g. a user
editing their own profile, or internal progress-tracking). Email MUST always show
a rendered preview before it can be sent; nothing is sent silently. Destructive
operations (delete, remove-from-group, revoke) MUST require an explicit
confirmation step in addition to the proposal card.

**Rationale:** consortium governance actions are consequential and often
irreversible (an email cannot be unsent); a human must remain accountable.

### II. Deterministic Workflows; the LLM Extracts and Narrates Only

Multi-step write sequences (onboarding, imports, batch group assignment) MUST be
executed by deterministic server code, not by an LLM tool-calling loop. The LLM's
role is limited to (a) understanding natural-language input and extracting
structured parameters, and (b) summarizing what the deterministic code did. When
the agent's reply describes an action requiring a tool, it MUST actually emit the
tool call in the same turn — narration is never a substitute for action, and the
agent MUST NOT claim an action succeeded unless a tool produced that result.

**Rationale:** LLM-driven write chains are brittle — they narrate instead of
acting, loop on confirmations, hallucinate success, and mis-sequence steps.
Deterministic protocols are correct, testable, and auditable.

### III. Live State Is the Source of Truth

Workflow steps MUST decide "done vs. pending" from the live state of the system
of record (Google Group membership, Forms responses, project `metadata_completeness`,
grant roster) — not from a cached flag — and MUST be idempotent and safe to re-run.
Cached tracking (e.g. `onboarding_checklist`) is a projection of live state for
display, never the authority. The only exception is state that cannot be observed
live (e.g. "email was sent"), which falls back to local proposal history.

**Rationale:** the agent shares its world with humans who change it directly;
trusting stale flags produces "stuck forever" and "lost progress" bugs.

### IV. Google Workspace Stays Canonical — Integrate, Never Replace

Google Forms, Groups, and Sheets remain the consortium's canonical intake and
records. The agent integrates with them — pre-filling forms from the KG, importing
responses, syncing group membership — but MUST NOT reimplement them. Stereotypical,
externally-owned questionnaires stay in Google so the agent never needs redeploying
when the consortium revises a form.

**Rationale:** lower maintenance, familiarity for members, and a single source of
record outside the agent's lifecycle.

### V. Least-Privilege Security: Tier + RLS + JWT

Access is enforced at two independent layers and BOTH MUST hold: the agent's tier
(from JWT `app_metadata.role`) gates which personas/tools are offered, and upstream
Postgres RLS is the final authority on every KG read/write. KG writes MUST execute
as the acting user's JWT so RLS adjudicates; the service-role key is reserved for
trusted local bookkeeping in the agent's own DB and MUST NEVER be used to bypass KG
RLS for a user-initiated action. Secrets MUST NOT reach the client bundle: server-
only logic lives in `.server.ts` modules that the client never imports.

KG reads are bound by the same rule and MUST declare an explicit auth context:
a read that backs a decision runs as the acting user's JWT; anonymous reads are
permitted ONLY against explicitly public surfaces (`*_public` views and the public
project/grant/publication directory) and MUST be labelled as such (`{ anon: true }`).
There MUST be NO silent anon fallback — a missing JWT MUST fail loud, never quietly
downgrade to the anon key. Because RLS returns an empty result, not an error, for
a blocked read, code MUST NOT treat "empty" as "not found" when the read could have
been RLS-filtered: distinguish no rows from not allowed, and prefer the correct
read surface (e.g. the RLS-blocked base `investigators` table vs the readable
`investigators_public` view) rather than guessing.

**Rationale:** defense in depth; the agent's notion of "admin" must never be the
sole gate on a real database mutation. The empty-vs-denied ambiguity of a silent
anon read is a proven bug generator — it makes "I'm not allowed to see this" look
identical to "this doesn't exist," producing wrong, confident answers.

### VI. Never Destroy User Data: Fill-Only-Empty, Merge-Don't-Clobber

Imports and automated writes MUST only populate empty fields and MUST NOT overwrite
a value a human curated. State merges (e.g. checklist persistence) MUST read current
state and merge, never blind-overwrite, and MUST NOT downgrade a completed step.
Before deleting or overwriting anything, the agent MUST confirm the target is what it
believes it to be.

**Rationale:** the KG holds months of human-entered metadata; silent clobbering is
the most damaging class of bug and the hardest to notice.

### VII. Guided UX over Blank-Prompt

The interface MUST surface the obvious next actions for the signed-in account as
clickable chips/cards rather than relying on users to know what to type. Account-
and state-aware suggestions appear on sign-in; replies offer concrete follow-ups.
Persona selection defaults to automatic routing by message content, with manual
override always available.

**Rationale:** consortium members are scientists and admins, not power users of this
tool; not everyone knows what they should be doing.

### VIII. Automated Tests, Live Verification, Then Human Sign-off

Testing happens in THREE ordered layers; a consortium-facing release is gated on all three.

**Layer 1 — automated (mocked):** deterministic logic MUST be covered by automated tests
with external systems (Google, Slack, Resend, Forms, the KG) mocked — especially
idempotency, fill-only-empty/merge behavior, role resolution, live-check branching, and
multi-grant safety. These run on every change and MUST pass first.

**Layer 2 — agent-driven live verification (ground truth):** before any human hand-off, the
change MUST be verified by the agent against the REAL systems using ground-truth tools —
NEVER the LLM's paraphrase of a result. The reference tools are: the live harness
(`tests/live/`, which runs the real functions against the live KG under a short-lived test
JWT), the in-app debug trace (`?debug=1`, which surfaces the literal tool calls + raw
`{ok,error}` results + resolved tier/persona), and direct reads (curl/REST) for KG/RLS
state. Debugging MUST start from the LITERAL error — the DB/RLS message, the tool
`{ok:false,error}`, the network body — and if that real error is not visible, making it
visible is the FIRST fix, never guessing from a narrated symptom. Whatever the agent cannot
prove this way (real OAuth, email/Slack delivery, form rendering, UX judgment) MUST be
recorded in the feature's `qa-itinerary.md` for Layer 3.

**Layer 3 — human sign-off:** a human runs the end-to-end QA itinerary against the real
systems for what only a person can confirm, and signs off. A release is gated on Layer 1
passing, Layer 2 verified, AND the Layer-3 must-pass items passing.

**Rationale:** automated tests protect the deterministic core cheaply; but this system's
correctness lives in real integrations, and the slowest, most error-prone step has been a
human relaying a paraphrased symptom ("there was an issue…") that hides the real cause.
Agent-driven live verification against ground truth closes the Find→Fix→Test→Verify loop
in-session — it has caught real bugs (a missing DB column behind a 400, an RLS-denied read,
a self-serve field the schema rejected, the wrong tool being chosen) before a human ever had
to look. Automated-first keeps iteration fast; ground-truth-next keeps diagnosis honest;
human-last keeps releases trustworthy.

### IX. Reversible & Recoverable Changes

Every change the agent applies MUST be recoverable — a mistake, a wrong target, or a
re-join has to be walk-back-able. This is binding for all delete, side_effect
removal, and update operations:

**Deletes capture a pre-image, not just an id.** Before a row is removed (e.g. a
`grant_investigators` link, an investigator), enough of its prior state to
reconstruct it MUST be recorded with the proposal/audit (e.g. the leaving role for
a roster link). Prefer soft-delete/archival over hard DELETE where the schema
allows it.

**Every removal/update has a defined inverse.** Group removal ↔ re-add, Slack kick ↔
re-invite, status/field change ↔ prior value. The parameters needed to apply that
inverse MUST be persisted so the reversal is a deterministic, human-reviewed proposal
— not guesswork.

**An undo path exists and is auditable.** Any applied proposal can be reversed by a
corresponding inverse proposal; the audit log links the original to its reversal so
the history reads forward and backward.

**Genuinely irreversible actions are gated, never silent.** Where an action truly
cannot be undone (an email already sent), Principle I's preview + explicit confirmation
stands in for reversibility, and the irreversibility MUST be stated before the human
confirms.

**Rationale:** offboarding and cleanup strip access and roster links that a typo or a
returning member must be able to restore; recoverability turns a scary destructive action
into a safe, auditable one. The proposal queue and audit trail already record that a
change happened — this principle requires recording enough to undo it.

### X. Full Data Provenance

Every value the agent writes and every change it makes MUST be traceable to its origin
and its complete edit history. For each change, the append-only provenance store
(`audit_log` + `pending_writes`, never rewritten) MUST record: the **actor** (user
identity + acting tier/persona, or the named automated source), the **time**, the
**trigger/source** (the user command, the Google Form + response id, NIH Reporter, a
specific import or workflow step), the **before and after values** (the Principle IX
pre-image is the "before"), and the **lineage** (propose → apply, plus any `undo_of`
link). No written value may be unattributable: if the system cannot answer "where did
this come from, what changed it, by whom, and when," the write is incomplete. Imports
MUST tag the fields they populate with their source, so a curator can later see
"imported from the onboarding form on <date>" — not merely that a value appeared.

**Rationale:** the KG is a shared scientific record; trust depends on tracing any value
to its source and history — to resolve disputes, audit decisions, and explain (then
reverse) mistakes. Provenance is the substrate that human-in-the-loop (I) and
reversibility (IX) stand on.

## Architecture & Runtime Constraints

The agent runs on TanStack Start deployed to Cloudflare Workers via Lovable; the KG
and the agent DB are separate Supabase projects. These constraints are binding:

- Internal server-to-server calls MUST use plain async functions, not
  `createServerFn`-over-HTTP (loopback fails in Workers). The `insertProposal` /
  `applyProposalCore` pattern is the reference.
- Workflow-style code MUST NOT use `Date.now()`, `Math.random()`, or argless
  `new Date()` where determinism/resumability matters; pass time in or stamp after.
- Public anon keys are hardcoded in server code intentionally (Workers env vars
  are unreliable); this is acceptable ONLY for public anon keys, never secrets.
- Two databases: never assume `supabaseAdmin` (agent DB) can read/write KG
  tables; KG access goes through the KG client with the user JWT.
- Migrations live in `supabase/migrations/` and are applied via Lovable; code
  MUST degrade gracefully when a migration has not yet been applied to the live DB.

## Development Workflow & Quality Gates

**Spec-driven for non-trivial work:** features and substantial changes flow
through `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` →
`/speckit.implement`. Bug fixes and small changes may skip ahead but MUST still
respect every Core Principle.

**Plans MUST pass a Constitution Check** before implementation; any deviation MUST
be recorded with explicit justification in the plan's Complexity Tracking section.

**Document outcomes:** user-facing automation changes are summarized in
`docs/ONBOARDING_AUTOMATION.md` (and architecture changes in
`docs/architecture-agent.md`). The doc is part of "done," not optional.

**Every substantive change follows the Find → Fix → Test → Verify-Live loop** (Principle
VIII), every session — not only for `[debug]:` reports:

- **FIND** — reproduce on the GROUND-TRUTH error: surface the literal DB/RLS message,
  tool `{ok:false,error}`, or network body via the live harness, `?debug=1` trace, or
  curl. Never debug from the LLM's paraphrase; if the real error isn't visible, making
  it visible is the first fix.
- **FIX** — at the lowest correct layer (constitution → spec/plan → migration → shared
  util → local patch), test-first, fixing the class not just the reported site.
- **TEST** — a Layer-1 automated test goes red→green and `npm test`/`npx vitest run`
  passes; `npx tsc --noEmit` is clean.
- **VERIFY-LIVE** — confirm against the REAL system (Layer 2): run the live harness /
  read the `?debug=1` trace / curl the KG, and log anything mocks-and-the-agent cannot
  prove to the feature's `qa-itinerary.md` for human sign-off (Layer 3).

Releases are gated on Layer 1 passing, Layer 2 verified, AND the itinerary's must-pass
items passing. State changes are confirmed against the live system and failures reported
honestly with the actual error.

**Reversibility is part of "done"** (Principle IX): any change that deletes,
removes, or revokes MUST ship with its pre-image capture + a defined inverse, and
an automated test proving the inverse restores the prior state. A destructive
surface without a recovery path is incomplete and MUST NOT be released.

**Provenance is part of "done"** (Principle X): any new write/import path MUST
record actor + time + source/trigger + before/after into the append-only audit
trail; imports MUST tag populated fields with their source. A write with no
traceable origin is incomplete.

**Commit hygiene:** work lands on `main` (or a branch when asked); commits are
authored by Nader without a Claude co-author trailer.

## Governance

This constitution supersedes other practices when they conflict. Amendments are made
by editing this file via `/speckit.constitution`, which MUST: bump the version per
the rules below, update the Sync Impact Report comment, and re-validate the
dependent templates (`plan-template.md`, `spec-template.md`, `tasks-template.md`)
and command files for consistency.

**Versioning (semantic):**

- **MAJOR** — a principle is removed or redefined in a backward-incompatible way.
- **MINOR** — a new principle/section is added or guidance materially expanded.
- **PATCH** — clarifications, wording, or non-semantic refinements.

**Compliance:** every plan produced by `/speckit.plan` MUST include a Constitution Check
gate. Reviewers (human or agent) MUST reject changes that violate a principle unless
the violation is justified and recorded. Complexity MUST be justified — simpler,
principle-aligned approaches are preferred by default.

**Version:** 1.5.0 | **Ratified:** 2026-05-29 | **Last Amended:** 2026-06-19
