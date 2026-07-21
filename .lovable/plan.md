
# BBQS Schema — schema.org alignment (frontend only)

Publish a BBQS type hierarchy that mirrors schema.org's style, purely as a **frontend artifact**. No DB migrations, no new columns, no backfills. The goal is a canonical, browsable "this is what BBQS types are and how they map to schema.org" — the same way schema.org itself is just a hierarchy of definitions with links.

## Deliverables

**1. Canonical type module** — `src/data/bbqs-schema.ts`

A single TypeScript file (source of truth) defining every BBQS type:
- `key` (e.g. `bbqs:Investigator`)
- `label`, `description`
- `subClassOf` — schema.org type URL (e.g. `https://schema.org/Person`)
- `parent` — parent BBQS key for tree rendering
- `properties[]` — each with name, expected type, schema.org equivalent when one exists, BBQS-specific note
- `instancesFrom[]` — which existing BBQS tables/pages surface rows of this type (informational, no code coupling)
- `examples[]` — one or two real BBQS instances (e.g. "1R61MH138612 — SeeMe")

**2. The type map** (what actually goes in the file)

```text
schema:Thing
├── schema:Organization
│   ├── bbqs:Consortium
│   ├── bbqs:ResearchOrganization      → schema:ResearchOrganization
│   └── bbqs:FundingAgency             → schema:FundingAgency
├── schema:Person
│   └── bbqs:Investigator              → schema:Person
├── schema:Project
│   └── bbqs:FundedProject             → schema:ResearchProject
├── schema:Grant
│   └── bbqs:NIHGrant                  → schema:MonetaryGrant (adds mechanism R61/R34/RF1)
├── schema:CreativeWork
│   ├── bbqs:Publication               → schema:ScholarlyArticle
│   ├── bbqs:Dandiset                  → schema:Dataset
│   ├── bbqs:SoftwareTool              → schema:SoftwareApplication
│   └── bbqs:Announcement              → schema:Article
├── schema:JobPosting
│   └── bbqs:Job                       → schema:JobPosting
├── schema:Taxon
│   └── bbqs:Species                   → schema:Taxon
├── schema:Product
│   └── bbqs:Device                    → schema:Product
│       ├── bbqs:NeuralRecordingDevice   (Neuropixels, wireless neural, iEEG, EEG, OPM)
│       ├── bbqs:BehavioralSensor        (video, thermal, IR, motion capture, eye tracker, IMU)
│       ├── bbqs:PhysiologicalSensor     (EDA, ECG, EMG, PPG, respiration, cortisol …)
│       ├── bbqs:EnvironmentalSensor     (LiDAR, mmWave, GPS, RFID, flow, ultrasonic mic)
│       └── bbqs:ImagingSystem           (fMRI, two-photon, thermal imaging)
└── schema:Event
    └── bbqs:WorkshopEvent             → schema:Event
```

**3. Browse page** — `src/pages/BbqsSchema.tsx` at `/schema`

Layout modeled loosely on schema.org itself, styled with our existing tokens (light bg, navy sidebar chrome, orange accents):
- Left rail: collapsible type tree with search
- Right pane: for the selected type — description, `subClassOf` link out to schema.org, properties table (BBQS prop → schema.org prop → notes), "Instances in BBQS" pointing to the relevant existing page (Projects, Investigators, Species, Devices…), example JSON-LD snippet
- Top of page: intro paragraph explaining "this mirrors schema.org so BrainKB, MCP consumers, and external crawlers can align"
- Sidebar link under Documentation

**4. Sidebar entry**

Add "Schema" (or "BBQS Types") under the Documentation section of `src/data/sidebar-config.ts`, pointing to `/schema`.

**5. That's it**

- No migrations.
- No changes to `resources`, `investigators`, `projects`, etc.
- No JSON-LD emission on entity pages this pass — we can layer that later if you want.
- No touch to the agent DB or BrainKB federation plan yet.

## Order of work

1. Draft `src/data/bbqs-schema.ts` with the ~20 types above.
2. Build `BbqsSchema.tsx` (tree + detail pane + search).
3. Register `/schema` route in `App.tsx` and add sidebar link.

Approve and I'll build it.
