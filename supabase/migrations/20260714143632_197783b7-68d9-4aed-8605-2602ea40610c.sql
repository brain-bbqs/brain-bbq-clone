
-- Cohort view: assigns each investigator to R61 and/or R34 based on their grants
CREATE OR REPLACE VIEW public.investigator_cohorts AS
SELECT DISTINCT
  gi.investigator_id,
  CASE
    WHEN g.grant_number ~* 'R61' THEN 'R61'
    WHEN g.grant_number ~* 'R34' THEN 'R34'
    ELSE 'other'
  END AS cohort
FROM public.grant_investigators gi
JOIN public.grants g ON g.id = gi.grant_id
WHERE g.grant_number ~* 'R61|R34';

GRANT SELECT ON public.investigator_cohorts TO authenticated;
GRANT SELECT ON public.investigator_cohorts TO service_role;

-- Attention counts per investigator (admin-only via RLS on underlying tables + role check)
CREATE OR REPLACE FUNCTION public.get_investigator_attention()
RETURNS TABLE(investigator_id uuid, clicks bigint, pageviews bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT i.id AS investigator_id,
         COALESCE(c.n, 0)::bigint AS clicks,
         COALESCE(p.n, 0)::bigint AS pageviews
  FROM public.investigators i
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS n FROM public.analytics_clicks
    WHERE user_id IS NOT NULL GROUP BY user_id
  ) c ON c.user_id = i.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS n FROM public.analytics_pageviews
    WHERE user_id IS NOT NULL GROUP BY user_id
  ) p ON p.user_id = i.user_id
  WHERE i.user_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_investigator_attention() TO authenticated;
