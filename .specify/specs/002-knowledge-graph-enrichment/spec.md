# 002 — Knowledge Graph Enrichment

**Pillar:** Knowledge Graph · **Status:** now

## Why
R61 and R34 projects live or die on device choice, wiring, and species suitability. The existing `/resources/devices` page catalogs what's used; the next step is to make it *actionable* — troubleshooting, manuals, and end-to-end "how to build the rig" recipes.

## What
Three linked capabilities on top of the current device graph:
1. **Device troubleshooting** — per-device-class known-gotcha library (already seeded on `/resources/devices`), extended with member-contributed notes.
2. **Manuals** — first-class manual URLs on every device, with a discovery pipeline (`device-manuals-discovery` edge function) filling gaps.
3. **"How to build the rig" recipes** — given an experiment goal + species, recommend a device stack with wiring notes and known pitfalls.

## Constitution alignment
- Evidence-linked: every device claim points to grant/pub source.
- Cross-species: recipes are species-parameterized.
- Open by default: recipes are readable without login.

## Success criteria
- ≥ 80% of devices have a linked manual within 90 days.
- ≥ 20 curated recipes covering the top R61/R34 experiment archetypes.
- Troubleshooting notes have ≥ 50 member contributions in the first quarter.