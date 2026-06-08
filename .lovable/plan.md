# Plan: Hardware & Methods Harvester for R61/R34 Grants

## Goal
For every R61/R34 grant in BBQS (starting with CMIE — `1R61MH138612-01`), pull together the **hardware specs, stimulation/recording parameters, and Methods-section excerpts** that would help a PI design their experiment. Source the data by walking NIH RePORTER's *Similar Projects* graph and the *Publications* of each node, then scraping the Methods sections from the web — without embedding everything.

## Strategy

### 1. Graph traversal (bounded)
For each seed R61/R34 grant:
- **Depth 0**: the grant itself → its NIH RePORTER publications.
- **Depth 1**: NIH RePORTER `similar_projects` → their publications.
- **Depth 2**: similar projects of the top-N (by match score) depth-1 nodes → their publications.
- **Stop at depth 2.** Cap: 5 similar projects per node, 10 publications per project. Track visited grant numbers to avoid cycles. This caps work at roughly 1 + 5 + 25 = 31 projects per seed.

Relationship source = NIH RePORTER's own links (not author overlap), as you specified.

### 2. Per-publication Methods extraction (no embeddings)
For each PMID found:
1. Resolve to a fetchable URL (PubMed → PMC full-text when available, else publisher/preprint link).
2. Scrape via Firecrawl (`scrape` with `markdown` + `onlyMainContent`).
3. Use a lightweight section extractor: regex/heading match for `Methods`, `Materials and Methods`, `Data acquisition`, `Stimulation parameters`, etc. Keep the matched section verbatim (truncate at next H2).
4. Send only that section to Lovable AI Gateway (`gemini-3-flash`) with a structured-output schema to pull:
   - `device_hardware` (e.g. "Nexstim NBT 2.2", "BrainAmp DC", "EASYCap 62-ch")
   - `stimulation_params` (waveform, intensity, ISI, targets)
   - `recording_params` (sampling rate, channels, montage)
   - `analysis_metrics` (PCI, ADR, etc.)
   - `setting` (ICU / outpatient / naturalistic / animal)
   - `irb_or_population` (sample size, IRB#)
   - `quote` (1–2 sentence verbatim Methods snippet)
   - `confidence` (0–1)

No vector embeddings. We only LLM-summarize the already-narrowed Methods section, so cost stays bounded.

### 3. Categorization axes (your taxonomy)
Tag each extracted record with:
- **Org type** from NIH RePORTER (`independent hospitals`, `schools of medicine`, etc.).
- **Setting**: academic / clinical-trial / independent-hospital / naturalistic.
- **Role**: hardware-development (R61-style) vs. clinical-application (R34-style).

### 4. Storage
New table `grant_methods_evidence` keyed by `(seed_grant, source_grant, pmid)` holding the structured fields + raw Methods snippet + URL + provenance (depth, match_score, org_type). Edge function `harvest-grant-methods` runs the traversal idempotently and is re-runnable per seed.

### 5. UI
On the existing grant profile page, add a **"Hardware & Methods Evidence"** tab grouped by:
- Hardware components (deduped across sources)
- Stimulation/recording parameter table
- Methods snippets, faceted by org-type & depth, each linking back to the PubMed/PMC URL and the originating NIH RePORTER project.

### 6. Diminishing-returns guardrails
- Stop traversing a branch when 3 consecutive publications yield `confidence < 0.3` extractions.
- Skip publications already extracted for another seed (global PMID cache).
- Per-seed hard cap: 60 publications scraped.

## Technical details (skim if non-technical)
- Edge function `harvest-grant-methods` (Deno) — uses existing `_shared/security.ts`, calls NIH RePORTER (already wrapped in `nih-reporter-search`), Firecrawl connector for scrape, Lovable AI Gateway for structured extraction.
- Firecrawl is the right connector here (not Perplexity) — we need raw Methods text, not synthesized answers.
- Migration adds `grant_methods_evidence` table + GRANTs + RLS (authenticated read; service_role write).
- Reuses existing `EntitySummaryModal` pattern for the new tab; no new routes.
- Idempotent: re-running on a seed updates rows, doesn't duplicate.

## Open questions before I build
1. **Scope**: start with just CMIE (`1R61MH138612-01`) end-to-end, then expand to all R61/R34, or build the table + function and batch-run across all R61/R34 immediately?
2. **Firecrawl connector**: is it already linked? If not I'll prompt the connector flow.
3. **Where should the new tab live** — inside the existing grant entity summary modal, or as a dedicated `/grants/:id/methods` page you can share with PIs?
