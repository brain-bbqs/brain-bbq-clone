DROP VIEW IF EXISTS public.project_devices_v;

CREATE VIEW public.project_devices_v AS
WITH base AS (
  SELECT
    e.*,
    COALESCE(e.device_model, '{}'::text[]) AS model_arr,
    COALESCE(e.device_class, '{}'::text[]) AS class_arr,
    COALESCE(e.manufacturer, '{}'::text[]) AS mfr_arr,
    CASE
      WHEN jsonb_typeof(e.device_hardware) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(e.device_hardware))
      ELSE '{}'::text[]
    END AS hardware_arr
  FROM public.grant_methods_evidence e
), expanded AS (
  SELECT
    b.*,
    gs.ord,
    NULLIF(trim(COALESCE(b.model_arr[gs.ord], b.model_arr[1], '')), '') AS signal_model,
    NULLIF(trim(COALESCE(b.hardware_arr[gs.ord], b.hardware_arr[1], '')), '') AS signal_hardware,
    NULLIF(trim(COALESCE(b.class_arr[gs.ord], b.class_arr[1], '')), '') AS signal_class,
    NULLIF(trim(COALESCE(b.mfr_arr[gs.ord], b.mfr_arr[1], '')), '') AS signal_manufacturer
  FROM base b
  CROSS JOIN LATERAL generate_series(
    1,
    GREATEST(
      1,
      cardinality(b.model_arr),
      cardinality(b.hardware_arr),
      cardinality(b.class_arr),
      cardinality(b.mfr_arr)
    )
  ) AS gs(ord)
), useful AS (
  SELECT *
  FROM expanded
  WHERE signal_model IS NOT NULL
     OR signal_hardware IS NOT NULL
     OR signal_class IS NOT NULL
     OR use_case IS NOT NULL
     OR cardinality(COALESCE(species, '{}'::text[])) > 0
     OR cardinality(COALESCE(environment_tags, '{}'::text[])) > 0
)
SELECT
  seed_grant_number AS grant_number,
  COALESCE(signal_class, 'unspecified') AS device_class,
  signal_model AS model_name,
  signal_manufacturer AS manufacturer,
  COALESCE(
    signal_model,
    signal_hardware,
    initcap(replace(signal_class, '_', ' ')),
    'Device evidence'
  ) AS device_label,
  signal_hardware AS hardware_label,
  COUNT(DISTINCT id)::integer AS evidence_count,
  MAX(confidence) AS confidence_max,
  (array_agg(DISTINCT pmid) FILTER (WHERE pmid IS NOT NULL))[1] AS sample_pmid,
  (array_agg(DISTINCT COALESCE(publication_title, source_grant_title)) FILTER (WHERE COALESCE(publication_title, source_grant_title) IS NOT NULL))[1] AS sample_title,
  array_agg(DISTINCT u) FILTER (WHERE u IS NOT NULL) AS manual_urls,
  array_agg(DISTINCT s) FILTER (WHERE s IS NOT NULL) AS species,
  array_agg(DISTINCT t) FILTER (WHERE t IS NOT NULL) AS environment_tags,
  (array_agg(use_case ORDER BY confidence DESC NULLS LAST, created_at DESC) FILTER (WHERE use_case IS NOT NULL))[1] AS sample_use_case,
  (array_agg(setting ORDER BY confidence DESC NULLS LAST, created_at DESC) FILTER (WHERE setting IS NOT NULL))[1] AS setting,
  (array_agg(source_url ORDER BY created_at DESC) FILTER (WHERE source_url IS NOT NULL))[1] AS source_url,
  (array_agg(source_grant_title ORDER BY created_at DESC) FILTER (WHERE source_grant_title IS NOT NULL))[1] AS source_grant_title,
  (array_agg(source_org ORDER BY created_at DESC) FILTER (WHERE source_org IS NOT NULL))[1] AS source_org,
  MIN(depth) AS min_depth,
  MAX(match_score) AS match_score_max,
  (array_agg(quote ORDER BY confidence DESC NULLS LAST, created_at DESC) FILTER (WHERE quote IS NOT NULL))[1] AS quote,
  MAX(created_at) AS latest_evidence_at
FROM useful
LEFT JOIN LATERAL unnest(COALESCE(manual_urls, '{}'::text[])) AS mu(u) ON true
LEFT JOIN LATERAL unnest(COALESCE(species, '{}'::text[])) AS sp(s) ON true
LEFT JOIN LATERAL unnest(COALESCE(environment_tags, '{}'::text[])) AS et(t) ON true
GROUP BY
  seed_grant_number,
  COALESCE(signal_class, 'unspecified'),
  signal_model,
  signal_manufacturer,
  COALESCE(signal_model, signal_hardware, initcap(replace(signal_class, '_', ' ')), 'Device evidence'),
  signal_hardware;

GRANT SELECT ON public.project_devices_v TO anon;
GRANT SELECT ON public.project_devices_v TO authenticated;
GRANT SELECT ON public.project_devices_v TO service_role;