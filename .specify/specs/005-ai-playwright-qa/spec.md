# 005 — AI-Playwright QA Runner

**Pillar:** Engineering · **Status:** now

## Why
The site keeps growing and manual QA doesn't scale. We need an interoperable way to add end-to-end tests so any contributor — internal or external — can drop in a check without learning the whole codebase, and every PR gets site-consistency guardrails.

## What
- A declarative test spec format (YAML or MDX) describing user journeys in plain language.
- A runner that turns each spec into a Playwright script via AI, executes it against a preview URL, and reports pass/fail with screenshots.
- Auto-runs on every PR via GitHub Actions.
- Public dashboard on `/roadmap` (or a dedicated `/qa` page) showing recent runs.

## Constitution alignment
- Open by default: test specs + runs are public.
- Agent transparency: AI-generated Playwright code is committed to the repo, reviewable, editable.

## Success criteria
- ≥ 30 journeys covered within one quarter.
- < 2% flake rate.
- Every PR gets a QA report comment.