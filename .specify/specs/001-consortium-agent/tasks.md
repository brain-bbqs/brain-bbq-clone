# 001 — Consortium Agent · Tasks

> Contributors: PRs against this file welcome. Each task should be small enough to land in one PR.

## Foundation
- [ ] Add `agent_events` table + RLS + admin-only read policy
- [ ] Add `member_agent_consent` table + per-user RLS
- [ ] Add Profile UI for consent toggles

## Newsletter
- [ ] `agent-newsletter` edge function — pulls last 30d of new grants/pubs/forum
- [ ] Newsletter draft review page (admin)
- [ ] Approve / edit / send flow with audit event

## Connection finder
- [ ] `agent-connect` edge function — embeds member profiles + publications
- [ ] Nightly cron writes suggestions to `member_connections_suggested`
- [ ] Member-facing "Suggested intros" panel (opt-in)

## Onboarding / off-boarding
- [ ] Onboarding checklist automation (identity link, access grant, welcome email draft)
- [ ] Off-boarding checklist automation (access revoke, handoff doc)

## Meeting graph
- [ ] Meeting suggestion job — clusters members by topic overlap
- [ ] Calendar integration (out of scope for v1 — draft mailto: links)

## Email triage
- [ ] Inbound webhook + `email_triage_suggestions` write
- [ ] Admin UI to accept / edit / reject suggested reply