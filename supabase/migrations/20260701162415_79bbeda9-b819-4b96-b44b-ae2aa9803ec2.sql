DROP VIEW IF EXISTS public.project_devices_v;

CREATE VIEW public.project_devices_v AS
WITH normalized AS (
  SELECT
    e.id,
    e.seed_grant_number AS grant_number,
    e.source_grant_number,
    e.source_grant_title,
    e.source_org,
    e.depth,
    e.match_score,
    e.pmid,
    e.publication_title,
    e.publication_year,
    e.source_url,
    e.methods_snippet,
    e.quote,
    e.confidence,
    e.manual_urls,
    e.species,
    e.environment_tags,
    e.use_case,
    e.setting,
    e.created_at,
    e.extracted_at,
    (
      SELECT trim(v)
      FROM unnest(NULLIF(e.device_model, '{}'::text[])) WITH ORDINALITY AS t(v, ord)
      WHERE trim(v) <> ''
      ORDER BY ord
      LIMIT 1
    ) AS first_model,
    (
      SELECT trim(v)
      FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(e.device_hardware) = 'array' THEN e.device_hardware ELSE '[]'::jsonb END
      ) WITH ORDINALITY AS t(v, ord)
      WHERE trim(v) <> ''
      ORDER BY ord
      LIMIT 1
    ) AS first_hardware,
    (
      SELECT trim(v)
      FROM unnest(NULLIF(e.device_class, '{}'::text[])) WITH ORDINALITY AS t(v, ord)
      WHERE trim(v) <> ''
      ORDER BY ord
      LIMIT 1
    ) AS first_class,
    (
      SELECT trim(v)
      FROM unnest(NULLIF(e.manufacturer, '{}'::text[])) WITH ORDINALITY AS t(v, ord)
      WHERE trim(v) <> ''
      ORDER BY ord
      LIMIT 1
    ) AS first_manufacturer
  FROM public.grant_methods_evidence e
), useful AS (
  SELECT *
  FROM normalized
  WHERE first_model IS NOT NULL
     OR first_hardware IS NOT NULL
     OR first_class IS NOT NULL
     OR use_case IS NOT NULL
     OR cardinality(COALESCE(species, '{}'::text[])) > 0
     OR cardinality(COALESCE(environment_tags, '{}'::text[])) > 0
)
SELECT
  grant_number,
  COALESCE(first_class, 'unspecified') AS device_class,
  first_model AS model_name,
  first_manufacturer AS manufacturer,
  COALESCE(
    first_model,
    first_hardware,
    initcap(replace(first_class, '_', ' ')),
    'Device evidence'
  ) AS device_label,
  first_hardware AS hardware_label,
  COUNT(*)::integer AS evidence_count,
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
  grant_number,
  COALESCE(first_class, 'unspecified'),
  first_model,
  first_manufacturer,
  COALESCE(first_model, first_hardware, initcap(replace(first_class, '_', ' ')), 'Device evidence'),
  first_hardware;

GRANT SELECT ON public.project_devices_v TO anon;
GRANT SELECT ON public.project_devices_v TO authenticated;
GRANT SELECT ON public.project_devices_v TO service_role;