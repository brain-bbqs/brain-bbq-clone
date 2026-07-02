# 006 — Species Enrichment · Plan

## Data
- Extend `species` records with `behavior_terms[]`, `vocalization_samples[]`, `ethogram_url`, `dataset_links[]`, `cross_species_analogues[]`.

## Sources
- Neurobehavior Ontology (NBO), Uberon, and species-specific ethograms.
- DANDI / EMBER / OpenNeuro dataset APIs.

## UI
- Extend `/species/:id` page with new sections.
- Cross-species analogue chips link to the paired species profile.