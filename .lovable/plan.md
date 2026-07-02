# Public Developer Roadmap (Spec-Kit style) + Devices Readability Fix

Two parts:
1. Extend `/roadmap` into a **public, open-source, Spec-Kit-structured** developer roadmap — anyone can read without signing in, and every roadmap item is expressed as a Spec-Kit artifact chain (Constitution → Spec → Plan → Tasks) so external contributors can pick it up cleanly.
2. Fix the Devices "Device" column so it's actually readable.

---

## Part 1 — Public Developer Roadmap, Spec-Kit style

### Goal
`/roadmap` becomes the canonical open surface for where BBQS is going. Three lenses on one page:
- **Constitution** — the governing principles every roadmap item must respect (open source, cross-species, evidence-linked, member privacy, agent transparency).
- **Themes / Specs** — curated pillars of work, each rendered as a mini spec (what & why, not how).
- **Live execution** — GitHub milestones + issues (already wired through the `github-roadmap` edge function), auto-linked to each spec by label.

The `/roadmap` route is **already public** (no `ProtectedRoute` wrapper in `src/App.tsx` line 75). We'll add an explicit "Public · Open source" header + ensure `robots` allows indexing.

### Spec-Kit adoption (lightweight, in-repo)

We adopt Spec Kit's artifact shape without adding the CLI. Everything lives in-repo as plain markdown + one TS data file so the roadmap page can render it, and external contributors can PR against the same files.

```text
.specify/
├── memory/
│   └── constitution.md              ← project-wide principles (rendered on /roadmap)
└── specs/
    ├── 001-consortium-agent/
    │   ├── spec.md                  ← what & why
    │   ├── plan.md                  ← tech approach
    │   └── tasks.md                 ← actionable checklist
    ├── 002-knowledge-graph-enrichment/
    ├── 003-communication-cadence-forum/
    ├── 004-brainkb-federation/
    ├── 005-ai-playwright-qa/
    └── 006-species-enrichment/
src/data/roadmap-themes.ts           ← index: id, title, status, pillar, specPath, githubLabel
```

Each folder is one roadmap theme. The roadmap page renders the index cards and, on click, deep-links to the corresponding markdown (rendered client-side via `react-markdown`, which is already used elsewhere in the app).

### Constitution (draft — `.specify/memory/constitution.md`)

Five principles governing every roadmap item:
1. **Open by default** — code, specs, tasks, and roadmap are public; no login required to read.
2. **Evidence-linked** — every claim, device, connection, or AI response cites its source (grant, publication, forum post).
3. **Cross-species and translational** — features that only serve one species must justify why.
4. **Member privacy and consent** — agent outputs about people require opt-in and are auditable.
5. **Agent transparency** — any AI-authored artifact (email reply, newsletter, forum suggestion) is labeled and human-ratifiable.

### Roadmap themes → Spec-Kit folders

| # | Theme | Pillar | Status |
|---|---|---|---|
| 001 | Consortium Agent (onboarding/off-boarding, monthly newsletter, cross-member connection finder, meeting knowledge graph, email triage) | Agent | now |
| 002 | Knowledge Graph Enrichment (device troubleshooting + manuals, "how to build the rig" recipes for R61/R34, per-species behavior/vocalizations) | Knowledge Graph | now |
| 003 | Communication Cadence — in-site Forum with optional AI co-responder | Comms | next |
| 004 | Merge BBQS graph into BrainKB (federation) | Knowledge Graph | next |
| 005 | AI-Playwright QA runner (interoperable spec format, per-PR site consistency) | Engineering | now |
| 006 | Species enrichment (behavior, sounds, datasets, ethograms) | Knowledge Graph | later |

Each folder ships with a starter `spec.md` + `plan.md` + empty `tasks.md`. Contributors extend `tasks.md` via PR; the roadmap page shows task counts and completion progress.

### Page layout (`src/pages/Roadmap.tsx` extension)

```text
┌──────────────────────────────────────────────────────────┐
│ Roadmap                         [Public · Open source]   │
│ What we're building, in the open. PRs welcome.           │
├──────────────────────────────────────────────────────────┤
│ Tabs: [ Constitution ] [ Themes ] [ Milestones ] [Issues]│
├──────────────────────────────────────────────────────────┤
│ Constitution tab:                                        │
│   renders .specify/memory/constitution.md                │
│                                                          │
│ Themes tab (default):                                    │
│   Now / Next / Later columns                             │
│   Each card:                                             │
│     • pillar chip (Agent / KG / Comms / Engineering)     │
│     • title + one-line summary                           │
│     • n open GitHub issues (auto-matched by label)       │
│     • [Spec] [Plan] [Tasks] deep links                   │
│   Click card → drawer renders the three markdown files   │
│                                                          │
│ Milestones / Issues tabs: unchanged (live GitHub data)   │
└──────────────────────────────────────────────────────────┘
```

### Files to add / change

**New**
- `.specify/memory/constitution.md`
- `.specify/specs/001-consortium-agent/{spec,plan,tasks}.md`
- `.specify/specs/002-knowledge-graph-enrichment/{spec,plan,tasks}.md`
- `.specify/specs/003-communication-cadence-forum/{spec,plan,tasks}.md`
- `.specify/specs/004-brainkb-federation/{spec,plan,tasks}.md`
- `.specify/specs/005-ai-playwright-qa/{spec,plan,tasks}.md`
- `.specify/specs/006-species-enrichment/{spec,plan,tasks}.md`
- `src/data/roadmap-themes.ts` — index metadata (id, title, pillar, status, specPath, githubLabel)
- `src/components/roadmap/ConstitutionPanel.tsx`
- `src/components/roadmap/ThemeCard.tsx`
- `src/components/roadmap/ThemeDrawer.tsx` — renders spec/plan/tasks tabs
- `src/components/roadmap/PillarBadge.tsx`

**Changed**
- `src/pages/Roadmap.tsx` — add Constitution + Themes tabs, keep Milestones + Issues tabs, add public/open-source header
- `vite.config.ts` — ensure `.specify/**/*.md` is importable as `?raw` (Vite supports this natively; no config change likely needed)

**Untouched**
- Auth: `/roadmap` is already public
- `github-roadmap` edge function: unchanged
- No DB changes

### Out of scope (this ticket ships the roadmap, not the features it describes)
Actually building the agent, forum, BrainKB federation, or Playwright QA runner. Each theme's `tasks.md` seeds the follow-up work; roadmap items get implemented in later PRs following `/speckit.implement`-style execution.

---

## Part 2 — Devices "Device" column readability

Screenshot shows the Device column at ~220px with a 3-line uppercase "MANUFACTURER/MODEL NOT REPORTED YET" caption dominating the tile.

Changes in `src/pages/Devices.tsx`:
- Device column: `width: 220` → `minWidth: 280, flex: 1.2` (breathes and grows).
- Replace the 3-line uppercase caption with a compact one-line muted chip: `— model TBD`.
- Bump device name to `text-sm font-semibold text-foreground`.
- Trim `Class` (140) and `Manufacturer` (140) to give the Device column its space.

Purely presentational. No data or business-logic changes.

---

## Technical notes

- Roadmap route already public — `src/App.tsx:75`.
- Markdown files imported with Vite `?raw`: `import constitution from "../../.specify/memory/constitution.md?raw"`.
- `react-markdown` is already in the dependency tree (used by other pages).
- Theme ↔ issue linking is client-side: `theme.githubLabel` matched against `issue.labels[].name` from the existing edge function response.
- All new components use shadcn primitives and semantic tokens (no hardcoded colors).
- `.specify/` folder is committed to the repo so the roadmap is versioned alongside code.
