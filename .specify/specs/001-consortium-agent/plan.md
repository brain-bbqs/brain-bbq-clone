# 001 — Consortium Agent · Plan

## Architecture
- Runtime: Supabase Edge Function per job (`agent-onboard`, `agent-newsletter`, `agent-connect`, `agent-meet`, `agent-email-triage`).
- Model: Lovable AI Gateway, `google/gemini-3-flash-preview` default; escalate to a stronger model for newsletter drafts.
- Tooling via AI SDK `tool()` with narrow input schemas — see `ai-sdk-agent-patterns`.
- Audit trail: every agent decision writes to a `agent_events` table (actor, job, input hash, output, confidence, human_ratified_by).

## Data
- New tables (all scoped to `auth.uid()` where relevant):
  - `agent_events` — audit log.
  - `member_connections_suggested` — proposed intros (with opt-in state per member).
  - `newsletter_drafts` — draft sections pending admin ratification.
  - `email_triage_suggestions` — inbound message id, suggested reply, confidence.

## Boundaries
- No autonomous sends: every outgoing artifact requires a human `ratified_at` timestamp.
- Opt-in table: `member_agent_consent (user_id, allow_intros, allow_newsletter_mention, allow_meeting_suggestions)`.

## Rollout
1. Ship audit + consent tables (dark launch).
2. Ship newsletter draft job (admin-only UI).
3. Ship connection finder (opt-in default off).
4. Ship onboarding automation.
5. Ship email triage last (highest blast radius).