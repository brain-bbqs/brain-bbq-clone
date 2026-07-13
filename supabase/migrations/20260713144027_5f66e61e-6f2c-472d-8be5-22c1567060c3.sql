
CREATE SCHEMA IF NOT EXISTS internal_research;
REVOKE ALL ON SCHEMA internal_research FROM PUBLIC;
GRANT USAGE ON SCHEMA internal_research TO service_role;

CREATE TABLE internal_research.interactional_profiles (
  investigator_id uuid PRIMARY KEY,
  liwc jsonb NOT NULL DEFAULT '{}'::jsonb,
  personality_score numeric,
  science_score numeric,
  adhesion numeric,
  token_count int NOT NULL DEFAULT 0,
  last_computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE internal_research.interactional_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigator_id uuid NOT NULL,
  personality_score numeric,
  science_score numeric,
  adhesion numeric,
  snapshot_date date NOT NULL DEFAULT current_date,
  UNIQUE (investigator_id, snapshot_date)
);

CREATE TABLE internal_research.interactional_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE internal_research.interactional_queue (
  investigator_id uuid PRIMARY KEY,
  enqueued_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE internal_research.interactional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_research.interactional_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_research.interactional_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_research.interactional_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_only_profiles ON internal_research.interactional_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY admin_only_snapshots ON internal_research.interactional_snapshots
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY admin_only_config ON internal_research.interactional_config
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY admin_only_queue ON internal_research.interactional_queue
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA internal_research TO service_role;

CREATE OR REPLACE FUNCTION internal_research.enqueue_investigator(_investigator_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = internal_research, public
AS $$
  INSERT INTO internal_research.interactional_queue (investigator_id, enqueued_at)
  VALUES (_investigator_id, now())
  ON CONFLICT (investigator_id) DO UPDATE SET enqueued_at = EXCLUDED.enqueued_at;
$$;

REVOKE ALL ON FUNCTION internal_research.enqueue_investigator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION internal_research.enqueue_investigator(uuid) TO service_role;

CREATE OR REPLACE FUNCTION internal_research.trg_enqueue_from_grant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, internal_research
AS $$
DECLARE _inv uuid;
BEGIN
  FOR _inv IN SELECT gi.investigator_id FROM public.grant_investigators gi WHERE gi.grant_id = NEW.id LOOP
    PERFORM internal_research.enqueue_investigator(_inv);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION internal_research.trg_enqueue_from_publication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, internal_research
AS $$
DECLARE _inv uuid;
BEGIN
  FOR _inv IN
    SELECT DISTINCT gi.investigator_id
      FROM public.project_publications pp
      JOIN public.projects p ON p.id = pp.project_id
      JOIN public.grants g ON g.id = p.grant_id
      JOIN public.grant_investigators gi ON gi.grant_id = g.id
     WHERE pp.publication_id = NEW.id
  LOOP
    PERFORM internal_research.enqueue_investigator(_inv);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION internal_research.trg_enqueue_from_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, internal_research
AS $$
DECLARE _inv uuid;
BEGIN
  SELECT id INTO _inv FROM public.investigators WHERE user_id = NEW.user_id LIMIT 1;
  IF _inv IS NOT NULL THEN
    PERFORM internal_research.enqueue_investigator(_inv);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION internal_research.trg_enqueue_from_suggestion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, internal_research
AS $$
DECLARE _inv uuid;
BEGIN
  SELECT id INTO _inv FROM public.investigators WHERE user_id = NEW.submitted_by LIMIT 1;
  IF _inv IS NOT NULL THEN
    PERFORM internal_research.enqueue_investigator(_inv);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enqueue_on_grant_change ON public.grants;
CREATE TRIGGER enqueue_on_grant_change
AFTER INSERT OR UPDATE OF abstract ON public.grants
FOR EACH ROW EXECUTE FUNCTION internal_research.trg_enqueue_from_grant();

DROP TRIGGER IF EXISTS enqueue_on_publication_change ON public.publications;
CREATE TRIGGER enqueue_on_publication_change
AFTER INSERT OR UPDATE OF title ON public.publications
FOR EACH ROW EXECUTE FUNCTION internal_research.trg_enqueue_from_publication();

DROP TRIGGER IF EXISTS enqueue_on_comment_change ON public.entity_comments;
CREATE TRIGGER enqueue_on_comment_change
AFTER INSERT OR UPDATE OF content ON public.entity_comments
FOR EACH ROW EXECUTE FUNCTION internal_research.trg_enqueue_from_comment();

DROP TRIGGER IF EXISTS enqueue_on_suggestion_change ON public.feature_suggestions;
CREATE TRIGGER enqueue_on_suggestion_change
AFTER INSERT OR UPDATE OF description ON public.feature_suggestions
FOR EACH ROW EXECUTE FUNCTION internal_research.trg_enqueue_from_suggestion();

INSERT INTO internal_research.interactional_config (key, value) VALUES
  ('personality_weights', '{"social":1.0,"posemo":1.0,"insight":1.0,"cogproc":1.0,"incl":0.5,"long_words":0.5,"negations":-0.5,"inhibition":-0.5,"anger":-0.75}'::jsonb),
  ('sources_enabled', '{"grants":true,"publications":true,"comments":true,"suggestions":true,"emails":false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
