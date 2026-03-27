DO $$
DECLARE
  v_investigator_id uuid := '526eb63b-840a-4d58-925c-6ecf666fe436';
  v_harvard_org_id uuid;
BEGIN
  SELECT id
  INTO v_harvard_org_id
  FROM public.organizations
  WHERE upper(name) = 'HARVARD UNIVERSITY'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_harvard_org_id IS NULL THEN
    INSERT INTO public.organizations (name)
    VALUES ('HARVARD UNIVERSITY')
    RETURNING id INTO v_harvard_org_id;
  END IF;

  INSERT INTO public.investigator_organizations (investigator_id, organization_id)
  SELECT v_investigator_id, v_harvard_org_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.investigator_organizations
    WHERE investigator_id = v_investigator_id
      AND organization_id = v_harvard_org_id
  );

  DELETE FROM public.investigator_organizations
  WHERE investigator_id = v_investigator_id
    AND organization_id <> v_harvard_org_id;
END $$;