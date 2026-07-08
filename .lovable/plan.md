# Social Force Field — Visualization & Measurement Plan

Goal: turn the three-layer framework (Interactional / Cognitive / Relational) into a real, measurable dashboard grounded in the literature, using signals already flowing through the BBQS platform. **Plan only — no implementation until approved.**

---

## 1. Framing (theory → layer → what we actually observe)

| Layer | Scale | Construct | Observable in BBQS |
|---|---|---|---|
| **Interactional** | Micro | Shared language: lexical alignment, "conceptual pacts", novel device/neuromod vocabulary | `entity_comments`, `feature_suggestions`, `curation_audit_log` free text, assistant chat logs, **published abstracts (`publications`)**, **GitHub issue/PR text** (via existing connector) |
| **Cognitive** | Meso | Shared attention & shared mental models | Co-viewing / co-commenting on `resources`, working-group topic overlap, ontology-decision agreement, `resource_links` density |
| **Relational** | Macro | Group identity & social cohesion | Pronoun/function-word ratios, co-PI graph (`grant_investigators`), workshop retention, in-group vs. out-group linguistic style toward AI agents |

Shared language sits at the bottom and propagates upward — new terms coined at the micro layer become the vocabulary of shared mental models (meso) and then anchor group identity (macro).

---

## 2. Parameters we can capture today (no new instrumentation)

**Interactional** — corpus = internal text + published abstracts + GitHub issues/PRs:
- Novel-term detection: extend the Ontology Approval candidate-term pipeline.
- Pairwise lexical alignment: cosine similarity of author term vectors, rolling window.
- Conceptual-pact detection: novel term reused by ≥3 authors within 14 days.

**Cognitive:**
- Co-attention graph from analytics + `entity_comments` on shared `resources`.
- Working-group topic overlap (Jaccard on keyword sets from grants + publications).
- Curation agreement rate (ontology + pending-change decisions).

**Relational:**
- Pronoun / function-word ratios (we/us/our vs. I/you/they) — Tausczik & Pennebaker signal.
- Co-investigator network cohesion (clustering coefficient, bridging ties).
- **AI-as-teammate delta**: live comparison of linguistic register when addressing human collaborators vs. the NeuroMCP / metadata / EMBER agents.
- Workshop retention across MIT 2026 / SFN 2025 rosters.

**Deferred (flag, don't build):** Zoom transcripts, Slack/Discord, timestamped shared-doc edits.

---

## 3. Metrics per layer (v1 target set)

**Interactional** — novel-term birth rate · lexical alignment score · conceptual-pact count.
**Cognitive** — co-attention density · WG topic overlap · curation agreement rate.
**Relational** — inclusive-pronoun ratio · cross-lab collaboration index · AI-as-teammate register delta.

Each metric gets: definition, source table(s), refresh trigger, stable ID for sparkline rendering.

---

## 4. Visualization

Replace the three flat cards with a stacked, animated three-layer field, bottom-up:

```text
┌─ Relational (Macro) ─── cohesion halo, pronoun ribbons ──┐
├─ Cognitive (Meso) ── shared-attention constellation ─────┤
└─ Interactional (Micro) ── lexical particles, new terms ──┘
```

- **Hero:** ambient looping video that echoes real BBQS motifs — mouse / macaque / zebrafish / songbird silhouettes, Neuropixels / miniscope / 2P mesoscope shapes, brain-region contours — resolving into the three stacked layers. (Generated: `src/assets/social-force-field-hero.mp4.asset.json`.)
- **Interactional diagram:** word-velocity cloud — novel terms glow on arrival, fade as they normalize.
- **Cognitive diagram:** force-directed graph of entities co-attended within a window.
- **Relational diagram:** chord diagram of cross-lab ties + pronoun-ratio gauge + AI-vs-human register delta.

---

## 5. Build order (for later approval)

1. Freeze metric definitions in `src/data/social-force-field.ts` (typed catalog, no live data yet).
2. Drop the BBQS-motif hero video into the page header.
3. Ship the three static-but-well-designed layer diagrams (reuse `SynergyNetwork`, `MarrChordDiagram`; add a word-velocity component).
4. Wire **Interactional** first — reuses ontology candidate-term pipeline + `entity_comments` + publications + GitHub issue ingest.
5. Wire **Cognitive** next — co-attention query on analytics + entity_comments.
6. Wire **Relational** last — pronoun classifier edge function + co-PI graph + AI-vs-human register delta (live).
7. Keep the page admin-only (already gated).

---

## 6. Decisions (locked in)

1. **Corpus scope (Interactional):** consortium-internal text + published abstracts + GitHub issue/PR text.
2. **Hero visual:** ambient video that visually echoes real BBQS motifs (not abstract).
3. **AI-as-teammate metric:** in-scope from v1, no ELSI hold.
4. **Refresh cadence:** **live** — metrics recompute on write (short debounce), not nightly.

Next step (awaiting go-ahead): turn §5 steps 1–3 into a concrete task list.
