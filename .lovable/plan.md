

## Problems Identified

1. **Completeness always 0%**: The grid reads `metadata_completeness` from the `projects` table, which is stored as 0. It needs to be computed dynamically from actual populated fields (species, approaches, sensors, etc.).

2. **Grid not scrollable / can't see all projects**: The AG Grid container is fixed at `height: 200px` with no scrolling, so projects beyond ~5 rows are cut off.

3. **Overall layout feels cramped**: The fixed-height grid plus the chat area below competes for space.

---

## Plan

### 1. Compute completeness dynamically in `ProjectGrid.tsx`

Instead of relying on the stored `metadata_completeness` value (which is always 0), compute it client-side from the project's actual fields. Check which of the ~12 metadata fields have non-empty values and calculate a percentage.

```
Fields to check: study_species, use_approaches, use_sensors, 
produce_data_modality, produce_data_type, use_analysis_types, 
use_analysis_method, develope_software_type, develope_hardware_type, 
keywords, website, study_human
```

A field counts as "filled" if it's a non-empty array, a non-empty string, or a non-null boolean. Completeness = (filled / total) * 100, rounded.

Update the query to select all relevant fields from `projects` rather than just `metadata_completeness`.

### 2. Make the grid scrollable

Change the grid height from fixed `200px` to a reasonable constrained height with scrolling enabled. Use something like `height: 220px` with AG Grid's built-in vertical scrollbar (which it already supports in fixed-height mode). The current 200px should actually scroll -- the real issue may be that there are only ~6 rows visible and pagination is off. Increase slightly to ~240px or keep at 200px but ensure the grid scrollbar works properly by verifying row count vs container size.

### 3. Files to modify

- **`src/components/metadata-assistant/ProjectGrid.tsx`**: Update the query to fetch all metadata fields from `projects`, compute completeness client-side, and keep the grid at a compact but scrollable height.

