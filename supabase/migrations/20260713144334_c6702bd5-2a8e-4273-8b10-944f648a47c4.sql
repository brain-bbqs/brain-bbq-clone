
CREATE OR REPLACE FUNCTION public.ir_is_authorized() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
      OR current_setting('request.jwt.claim.role', true) = 'service_role'
      OR current_setting('role', true) = 'service_role';
$$;

CREATE OR REPLACE FUNCTION public.ir_upsert_profiles(_rows jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = internal_research, public
AS $$
DECLARE _n int;
BEGIN
  IF NOT public.ir_is_authorized() THEN RAISE EXCEPTION 'not authorized'; END IF;
  INSERT INTO internal_research.interactional_profiles
    (investigator_id, liwc, personality_score, science_score, adhesion, token_count, last_computed_at)
  SELECT (r->>'investigator_id')::uuid,
         COALESCE(r->'liwc','{}'::jsonb),
         (r->>'personality_score')::numeric,
         (r->>'science_score')::numeric,
         (r->>'adhesion')::numeric,
         COALESCE((r->>'token_count')::int, 0),
         COALESCE((r->>'last_computed_at')::timestamptz, now())
    FROM jsonb_array_elements(_rows) r
  ON CONFLICT (investigator_id) DO UPDATE SET
    liwc = EXCLUDED.liwc,
    personality_score = EXCLUDED.personality_score,
    science_score = EXCLUDED.science_score,
    adhesion = EXCLUDED.adhesion,
    token_count = EXCLUDED.token_count,
    last_computed_at = EXCLUDED.last_computed_at;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

CREATE OR REPLACE FUNCTION public.ir_snapshot_now()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = internal_research, public
AS $$
DECLARE _n int;
BEGIN
  IF NOT public.ir_is_authorized() THEN RAISE EXCEPTION 'not authorized'; END IF;
  INSERT INTO internal_research.interactional_snapshots
    (investigator_id, personality_score, science_score, adhesion, snapshot_date)
  SELECT investigator_id, personality_score, science_score, adhesion, current_date
    FROM internal_research.interactional_profiles
  ON CONFLICT (investigator_id, snapshot_date) DO UPDATE SET
    personality_score = EXCLUDED.personality_score,
    science_score = EXCLUDED.science_score,
    adhesion = EXCLUDED.adhesion;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

CREATE OR REPLACE FUNCTION public.ir_drain_queue(_limit int DEFAULT 200)
RETURNS TABLE(investigator_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = internal_research, public
AS $$
BEGIN
  IF NOT public.ir_is_authorized() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
    WITH d AS (
      DELETE FROM internal_research.interactional_queue
       WHERE investigator_id IN (
         SELECT q.investigator_id FROM internal_research.interactional_queue q
         ORDER BY q.enqueued_at LIMIT _limit
       )
      RETURNING investigator_id
    )
    SELECT d.investigator_id FROM d;
END;
$$;

CREATE OR REPLACE FUNCTION public.ir_list_profiles()
RETURNS TABLE(
  investigator_id uuid,
  full_name text,
  personality_score numeric,
  science_score numeric,
  adhesion numeric,
  token_count int,
  last_computed_at timestamptz,
  liwc jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = internal_research, public
AS $$
BEGIN
  IF NOT public.ir_is_authorized() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
    SELECT p.investigator_id,
           COALESCE(i.full_name, '(unknown)')::text,
           p.personality_score, p.science_score, p.adhesion,
           p.token_count, p.last_computed_at, p.liwc
      FROM internal_research.interactional_profiles p
      LEFT JOIN public.investigators i ON i.id = p.investigator_id
     ORDER BY p.adhesion DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.ir_consortium_trend()
RETURNS TABLE(snapshot_date date, mean_personality numeric, mean_science numeric, mean_adhesion numeric, n int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = internal_research, public
AS $$
BEGIN
  IF NOT public.ir_is_authorized() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
    SELECT s.snapshot_date,
           avg(s.personality_score)::numeric,
           avg(s.science_score)::numeric,
           avg(s.adhesion)::numeric,
           count(*)::int
      FROM internal_research.interactional_snapshots s
     GROUP BY s.snapshot_date
     ORDER BY s.snapshot_date;
END;
$$;
