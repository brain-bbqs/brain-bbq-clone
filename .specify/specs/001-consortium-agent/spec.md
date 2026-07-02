# 001 — Consortium Agent

**Pillar:** Agent · **Status:** now

## Why
Administrative overhead (onboarding, newsletters, connecting members, scheduling, first-pass email) is the bottleneck to consortium-wide science. An always-on agent absorbs the mechanical work so PIs and admins spend time on judgment, not glue.

## What
A supervised agent with five bounded jobs:
1. **Onboarding / off-boarding** — new member arrives → identity link → access provision → welcome packet; departing member → access revoke → knowledge handoff.
2. **Monthly newsletter generation** — reads new grants, publications, working-group activity, forum threads; drafts a newsletter section for admin review.
3. **Cross-member connection finder** — reads project profiles + publications and surfaces "PI X and PI Y should talk about topic Z" between members, not just admin ↔ member.
4. **Meeting knowledge graph** — organizes recurring 1:1s and small-group meets between relevant people; surfaces the "who should meet whom" graph.
5. **Email triage** — first-pass responder to consortium@ when admins aren't available; hands off to human on low confidence with a suggested draft.

## Constitution alignment
- Open by default: the agent's decision logs are public (redacted for PII).
- Evidence-linked: every suggestion cites the grant/pub/forum post it drew from.
- Member privacy: agent outputs about a person require that person's opt-in.
- Agent transparency: every email or newsletter section is labeled AI-authored and ratified by a human before send.

## Success criteria
- Onboarding: new member → provisioned in < 1 business day, zero manual DB edits.
- Newsletter: monthly send has ≥ 80% AI-drafted content approved with light edits.
- Connections: ≥ 3 novel introductions per month that lead to a follow-up meeting.
- Email triage: ≥ 50% of inbound consortium@ mail gets a suggested reply within 1 hour.

## Out of scope
- Autonomous sends without human ratification.
- Agent making membership decisions.