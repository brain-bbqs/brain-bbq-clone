# BBQS Constitution

These principles govern every roadmap item, spec, and PR in the Brain Behavior Quantification & Synchronization (BBQS) consortium codebase. Contributors — internal or external — should be able to point to which principle a change upholds.

## 1. Open by default
Code, specs, tasks, and the roadmap itself are public. No login is required to read them. Anything that must be private (member PII, unpublished data) is scoped to `auth.uid()` with explicit RLS, never hidden behind "security through obscurity."

## 2. Evidence-linked
Every claim, device, connection, or AI response cites its source — grant number, publication PMID, forum post, or dataset URL. Unsourced assertions are a smell, not a feature.

## 3. Cross-species and translational
BBQS spans human, non-human primate, rodent, and beyond. Features that only serve one species must justify why in the spec. Data models default to multi-species; single-species assumptions are called out.

## 4. Member privacy and consent
Any agent output *about* a person (email reply on their behalf, connection suggestion, meeting invite) requires opt-in and produces an auditable trail. Members can inspect, correct, and revoke.

## 5. Agent transparency
Any AI-authored artifact — email reply, newsletter section, forum suggestion, roadmap draft — is labeled as AI-authored and is human-ratifiable before it goes out. No silent ghostwriting.

## Governance
- Changes to this constitution require a PR that references at least one existing spec impacted by the change.
- Every roadmap theme in `.specify/specs/` must state, in its `spec.md`, which principles it upholds.
- Reviewers may block a PR on constitutional grounds; the author addresses it or amends the constitution.