# 004 — Merge BBQS Graph into BrainKB

**Pillar:** Knowledge Graph · **Status:** next

## Why
BBQS holds a rich 3-layer graph (organizations → resources → edges). BrainKB is the broader neuroscience knowledge graph. Federating BBQS upstream multiplies the reach of every device, grant, and publication BBQS curates, and lets BBQS pull in adjacent knowledge.

## What
- Export BBQS entities in a BrainKB-compatible schema (mapping documented in `plan.md`).
- Bidirectional sync: BBQS pushes new entities; BrainKB URIs are stored on BBQS records for provenance.
- A public `/api/brainkb-export` endpoint for auditability.

## Constitution alignment
- Open by default: export is public.
- Evidence-linked: every exported entity carries its BBQS provenance.