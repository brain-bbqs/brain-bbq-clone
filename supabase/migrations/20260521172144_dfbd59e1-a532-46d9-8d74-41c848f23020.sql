
-- Merge stub investigators (no email) into curated counterparts (with email)
-- where first+last name tokens match. Repoints grant_investigators and
-- investigator_organizations, then deletes the stub rows.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    WITH norm AS (
      SELECT id, name, email,
        lower(split_part(regexp_replace(name,'\s+',' ','g'),' ',1)) AS first_tok,
        lower(regexp_replace(regexp_replace(name,'\s+',' ','g'),'.* ','')) AS last_tok
      FROM public.investigators
    ),
    ranked AS (
      SELECT a.id AS stub_id, b.id AS keep_id,
             row_number() OVER (PARTITION BY a.id ORDER BY length(b.email) DESC, b.id) AS rn
      FROM norm a
      JOIN norm b ON a.id <> b.id
        AND a.first_tok = b.first_tok AND a.last_tok = b.last_tok
      WHERE a.email IS NULL AND b.email IS NOT NULL
    )
    SELECT stub_id, keep_id FROM ranked WHERE rn = 1
  LOOP
    -- Repoint grant_investigators (avoid unique conflicts)
    INSERT INTO public.grant_investigators (grant_id, investigator_id, role, role_source)
    SELECT gi.grant_id, r.keep_id, gi.role, gi.role_source
    FROM public.grant_investigators gi
    WHERE gi.investigator_id = r.stub_id
    ON CONFLICT DO NOTHING;
    DELETE FROM public.grant_investigators WHERE investigator_id = r.stub_id;

    -- Repoint investigator_organizations
    INSERT INTO public.investigator_organizations (investigator_id, organization_id)
    SELECT r.keep_id, io.organization_id
    FROM public.investigator_organizations io
    WHERE io.investigator_id = r.stub_id
    ON CONFLICT DO NOTHING;
    DELETE FROM public.investigator_organizations WHERE investigator_id = r.stub_id;

    -- Delete the stub investigator (and its orphan resource)
    DELETE FROM public.investigators WHERE id = r.stub_id;
  END LOOP;
END $$;
