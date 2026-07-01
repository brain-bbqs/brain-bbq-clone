# Device-Enrichment Plan — NIH RePORTER → Knowledge Graph (v2)

Goal: for every BBQS grant, walk NIH RePORTER (similar projects + linked publications), extract the **devices, manufacturers, and manuals** actually used, and land that into project metadata + KG so it shows up on project pages, heatmaps, and search.

Most plumbing already exists (`harvest-grant-methods-multihop`, `harvester-tick`, `grant_methods_evidence`, `AdminKgLive`). This plan adds the *device-first, manufacturer-first, manual-first* layer on top.

## 1. What we're extracting (first-class device model)

Every clinical + research device is a **first-class node**, not a bucket. Human-clinical hardware (DBS leads, iEEG grids, sEEG electrodes, scalp EEG, MEG) sits at the same level as animal hardware (Neuropixels, miniscopes, fiber photometry).

Per extraction row we capture:

- **device_class** — canonical category (`silicon_probe`, `neuropixels`, `miniscope`, `2p_microscope`, `fiber_photometry`, `optogenetics`, `ephys_headstage`, `iEEG_grid`, `sEEG_electrode`, `DBS_lead`, `EEG_scalp`, `MEG`, `fMRI`, `wearable_actigraphy`, `behavior_rig`, `eye_tracker`)
- **device_model** — specific model string ("Neuropixels 2.0", "Inscopix nVista 3", "Medtronic Percept PC", "Ad-Tech RD10R-SP05X")
- **manufacturer** — canonical company ("IMEC", "Inscopix", "Medtronic", "Ad-Tech", "Blackrock Neurotech", "Neuralynx", "Open Ephys", "PMT Corp", "DIXI Medical")
- **manufacturer_url** — company homepage
- **product_url** — product page on the manufacturer site
- **manual_urls[]** — user manual / datasheet / spec sheet PDFs
- **modality** — `ephys` / `imaging` / `stim` / `behavior` / `clinical_recording` / `neuroimaging`
- **regulatory** — `research_use_only` / `FDA_510k` / `FDA_PMA` / `CE_marked` (when derivable)
- **species + paradigm** (already in .lovable/plan.md — reuse)

Canonical vocab lives in `harvester_synonyms`; novel terms flow into `harvester_keywords` for curation.

## 2. Where manuals + manufacturer data come from

Discovery cascade the harvester runs for each `(device_model, manufacturer)` pair it extracts:

```text
1. Manufacturer site (authoritative)
   - Firecrawl map(manufacturer_url) → filter links matching /manual|datasheet|spec|guide|IFU|instructions/i
   - Firecrawl scrape those pages → grab PDF links + product page

2. FDA databases (clinical devices only)
   - openFDA 510(k):  https://api.fda.gov/device/510k.json?search=device_name:"..."
   - openFDA PMA:     https://api.fda.gov/device/pma.json
   - Gives regulatory status + official device labeling PDFs

3. NIH / vendor consortia
   - Open Ephys docs (open-ephys.github.io)
   - IMEC Neuropixels user manual (neuropixels.org)
   - Inscopix support portal
   - Medtronic manuals library (manuals.medtronic.com)
   - Blackrock Neurotech support docs

4. Publication itself
   - Methods section often cites "Model X (Manufacturer, City)" — we already scrape this
   - Supplementary PDFs sometimes include wiring diagrams; store as manual_urls[]

5. Google Scholar / DOI resolvers (fallback)
   - Used only when 1–4 return nothing, to find a review paper that references the manual
```

All of this runs through the existing Firecrawl budget. Manufacturer domains get cached in a new `device_manufacturers` table so we hit each vendor site once per week, not per grant.

## 3. Data changes

New table `device_manufacturers`:

- `id`, `name` (canonical), `aliases text[]`, `homepage_url`, `country`, `notes`, `last_crawled_at`

New table `device_models`:

- `id`, `manufacturer_id`, `device_class`, `model_name`, `product_url`, `regulatory`, `manual_urls text[]`, `first_seen_at`, `last_verified_at`, `confidence`

Add to `grant_methods_evidence`:

- `device_class text[]`
- `device_model_ids uuid[]` (fk into `device_models`)
- `manufacturer_ids uuid[]` (fk into `device_manufacturers`)
- `modality text[]`

Rollup view `project_devices_v` = `(grant_number, device_class, model_name, manufacturer, product_url, manual_urls, evidence_count, sample_pmid)` for fast project-page reads.

Nightly job syncs `projects.metadata.devices` from the view so the existing project profile UI keeps working.

## 4. Extractor prompt upgrade

`harvest-grant-methods-multihop` JSON schema gains:

```json
{
  "device_class": ["DBS_lead"],
  "device_model": ["Medtronic 3389"],
  "manufacturer": ["Medtronic"],
  "modality": ["stim", "clinical_recording"],
  "quote": "…implanted with Medtronic 3389 DBS leads connected to a Percept PC IPG…",
  "confidence": 0.92
}
```

Prompt includes current synonym list so `2P` → `2p_microscope`, `Inscopix` → `miniscope`, `Percept` → `DBS_IPG`.

## 5. Runner cadence

- `harvester-tick` (already cron'd) picks seeds from `harvester_queue` — no change.
- **Device-priority boost**: seeds with 0 rows in `project_devices_v` jump the queue.
- **Manufacturer refresh worker**: separate tick every 6h iterates `device_manufacturers` where `last_crawled_at` > 7d and re-maps their site for new manuals.
- Firecrawl budget stays throttled (per-tick cap).
- Manual "Refresh devices for this grant" button on the project profile posts a one-off tick.

## 6. Where it shows up

- **Project profile** — new "Instruments & devices" section: chips grouped by modality, each linking to product page + manual PDFs + source PMID.
- **Device detail page** (`/devices/:id`) — model card with manufacturer, regulatory status, all manuals, all grants using it, all publications citing it.
- **Manufacturer detail page** (`/manufacturers/:id`) — company card, all their models, all grants across BBQS using them.
- **AdminKgLive** — heatmap gains `device_class × organization` and `manufacturer × device_class` axes.
- **Search** — device_class, device_model, and manufacturer become facets ("show all grants using Neuropixels 2.0", "show all grants using Medtronic hardware").
- **Curation console** (`/admin/kg-curate`) — novel device terms + unverified manuals surface for merge/approve.

## 7. Build order

1. Migration: `device_manufacturers`, `device_models`, 4 new columns on `grant_methods_evidence`, `project_devices_v`.
2. Extend extractor JSON + seed synonym list (~60 canonical device terms across research + clinical).
3. Manufacturer/manual discovery worker (Firecrawl map → filter → scrape → store).
4. openFDA lookup helper for clinical devices.
5. Update `harvester-tick` priority to boost device-empty seeds.
6. Project profile "Instruments & devices" panel + `/devices/:id` + `/manufacturers/:id` pages.
7. Heatmap axes + search facets.

## Open questions

- Manual PDFs: store just the URL, or mirror into Supabase Storage so links don't rot?
- Regulatory scope: pull FDA only, or also EU MDR / Health Canada?
- On project profile, auto-show devices, or gate behind admin approval per row?
