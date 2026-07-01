## Where things stand right now

I checked the last 10 harvester runs. Every one finished in 5-20 seconds with `evidence_rows: 0` and `firecrawl_calls: 0 or 1`. So the pipeline **is running**, but the extractor is falling out before it writes anything. That's why the Devices table is empty — not a timing issue, a bug.

Root causes I need to fix before we talk about visuals:

1. Runs stop at hop 1 with `pubs_found: 0` for most seeds — the RePORTER → PubMed fan-out is short-circuiting instead of walking to publications.
2. When we do reach a publication, the extractor's device-block gate is too strict — the LLM returns "no devices" for abstracts that clearly mention hardware.
3. There is no retry on empty extractions, so a single miss = grant permanently marked "done, 0 rows".

Total wall-clock estimate once fixed: **~30-40 seconds per grant × ~60 grants = 30-40 minutes** for a full first pass. Manuals resolution adds another ~1-2 min per unique manufacturer.

## What I'll build

### 1. Fix the extractor so devices actually land

- Force `harvester-tick` to always fan out to at least 5 similar projects + all linked PubMed IDs per seed (currently it bails on the first empty page).
- Rewrite the LLM device prompt as a structured schema call with a "no-device? explain why in one line" field so we can see refusals in `last_message`.
- Add a fallback pass: if hop-2 returns 0 devices, fetch the PMC full text (not just abstract) via Firecrawl before giving up.
- Add `retry_after` on `harvester_runs` so a failed grant re-queues once.

### 2. First-class device *context* columns

Extend `grant_methods_evidence` (and the `project_devices_v` rollup) with:

- `species_context` — e.g. `mouse`, `macaque`, `human`, `zebrafish` (pulled from the same paper the device was found in, not the whole grant).
- `setting` — `clinical` / `preclinical` / `field` / `wearable-home` / `computational`.
- `environment_tags[]` — free-form but curated: `operating-room`, `ICU`, `home-cage`, `head-fixed rig`, `freely-moving`, `open-field`, `wildlife-collar`, etc.
- `use_case` — one sentence pulled from the paper ("recorded from CA1 during a fear-conditioning task").

The LLM extraction prompt will be updated to fill these in the same call that finds the device — no extra tokens per row.

### 3. Manuals + datasheets discovery

Runs as a **second, cheap worker** (only triggered when a new `device_models` row lands, not per-evidence):

- Firecrawl `map` on the manufacturer domain → filter for `/manual|datasheet|IFU|user-guide|instructions/i` and `.pdf`.
- For clinical devices (DBS leads, iEEG grids), hit **openFDA 510(k)/PMA** by manufacturer+model → pull the official labeling PDF URL.
- Store both in `device_models.manual_urls[]` with a `source` tag (`vendor` | `openFDA` | `open-ephys`).

### 4. Knowledge-graph visualization of *sources*

New page at **`/resources/devices/graph`** (linked from a "View graph" toggle on the Devices page). It shows exactly **where each fact came from**:

```text
   [Grant]───similar───▶[Grant]
      │                    │
      ▼                    ▼
 [Publication]         [Publication]
      │                    │
      ▼                    ▼
   [Device]  ◀─made-by─  [Manufacturer]
      │
      ▼
   [Manual PDF]
```

Built as a 2D force graph (react-force-graph-2d, same lib we already used) with:

- Node color by type (grant / pub / device / manufacturer / manual).
- Hover reveals: source URL, PMID, confidence, extraction timestamp.
- Filter chips: species, setting, device class.
- No animation gimmicks — this is the "boring, defensible" version, not the bunny.

The graph reads from `grant_methods_evidence` + `grant_methods_traversal_paths` (already exists) + the new `device_models` / `device_manufacturers` tables. No new tables required for the viz itself.

### 5. Ordering

1. Migration: add `species_context`, `setting`, `environment_tags`, `use_case`, `retry_after`. Extend the `project_devices_v` view.
2. Rewrite the extractor prompt + PMC fallback + fan-out fix.
3. Re-run harvester across all ~60 seeded grants (I trigger it, no admin button).
4. Ship the manuals discovery worker.
5. Ship `/resources/devices/graph`.

## Open question before I start

For the **environment tags**, do you want me to (a) let the LLM emit freeform tags and clean them up with a synonym table later, or (b) constrain it to a fixed vocabulary now (`operating-room`, `home-cage`, `head-fixed`, `freely-moving`, `field`, `wearable`, `computational-only`)?

(a) is more permissive and catches surprises; (b) makes the graph filters clean from day one. I'd lean (b).
