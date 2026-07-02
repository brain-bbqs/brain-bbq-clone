# 004 — BrainKB Federation · Plan

## Mapping
- Draft a mapping table: BBQS entity type → BrainKB class (grants → funding, devices → instrument, publications → publication, species → taxon).
- Encode as MARR-style yaml (reuse existing `public/bbqs_marr.yaml` pattern).

## Transport
- Edge function `brainkb-export` streams NDJSON of entities + edges.
- Nightly delta job pushes changes upstream once BrainKB accepts the payload.

## Provenance
- Add `brainkb_uri` column to relevant BBQS tables when a mapping exists.