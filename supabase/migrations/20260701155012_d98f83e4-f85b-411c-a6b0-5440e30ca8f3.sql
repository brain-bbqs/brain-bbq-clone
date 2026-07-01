-- Widen project_devices_v so evidence rows without an extracted device_class
-- still appear (they carry species, environment_tags, use_case, and PMID which
-- are useful even when the specific hardware wasn't named in the paper).
DROP VIEW IF EXISTS public.project_devices_v;
CREATE VIEW public.project_devices_v AS
SELECT
  e.seed_grant_number AS grant_number,
  COALESCE(dc.device_class, 'unspecified') AS device_class,
  dm.model_name,
  mf.manufacturer,
  count(*)::int AS evidence_count,
  max(e.confidence) AS confidence_max,
  (array_agg(DISTINCT e.pmid) FILTER (WHERE e.pmid IS NOT NULL))[1] AS sample_pmid,
  (array_agg(DISTINCT e.publication_title) FILTER (WHERE e.publication_title IS NOT NULL))[1] AS sample_title,
  array_agg(DISTINCT mu.u) FILTER (WHERE mu.u IS NOT NULL) AS manual_urls,
  array_agg(DISTINCT sp.s) FILTER (WHERE sp.s IS NOT NULL) AS species,
  array_agg(DISTINCT et.t) FILTER (WHERE et.t IS NOT NULL) AS environment_tags,
  (array_agg(e.use_case) FILTER (WHERE e.use_case IS NOT NULL))[1] AS sample_use_case,
  (array_agg(e.setting) FILTER (WHERE e.setting IS NOT NULL))[1] AS setting
FROM grant_methods_evidence e
  LEFT JOIN LATERAL unnest(NULLIF(e.device_class, '{}'::text[])) dc(device_class) ON true
  LEFT JOIN LATERAL unnest(NULLIF(e.device_model, '{}'::text[])) dm(model_name) ON true
  LEFT JOIN LATERAL unnest(NULLIF(e.manufacturer, '{}'::text[])) mf(manufacturer) ON true
  LEFT JOIN LATERAL unnest(NULLIF(e.manual_urls, '{}'::text[])) mu(u) ON true
  LEFT JOIN LATERAL unnest(NULLIF(e.species, '{}'::text[])) sp(s) ON true
  LEFT JOIN LATERAL unnest(NULLIF(e.environment_tags, '{}'::text[])) et(t) ON true
GROUP BY e.seed_grant_number, COALESCE(dc.device_class, 'unspecified'), dm.model_name, mf.manufacturer;

GRANT SELECT ON public.project_devices_v TO anon, authenticated;
GRANT ALL ON public.project_devices_v TO service_role;