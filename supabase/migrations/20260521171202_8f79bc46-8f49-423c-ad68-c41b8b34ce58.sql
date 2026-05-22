
DO $$
DECLARE
  _res_id uuid;
BEGIN
  -- Lizzy Ankudowich
  IF NOT EXISTS (SELECT 1 FROM public.investigators WHERE lower(email) = 'lizzy.ankudowich@nih.gov') THEN
    INSERT INTO public.resources (name, resource_type)
    VALUES ('Lizzy Ankudowich', 'investigator')
    RETURNING id INTO _res_id;

    INSERT INTO public.investigators (name, email, pending_role, resource_id)
    VALUES ('Lizzy Ankudowich', 'lizzy.ankudowich@nih.gov', 'member', _res_id);
  END IF;

  -- Ming Zhan
  IF NOT EXISTS (SELECT 1 FROM public.investigators WHERE lower(email) = 'ming.zhan@nih.gov') THEN
    INSERT INTO public.resources (name, resource_type)
    VALUES ('Ming Zhan', 'investigator')
    RETURNING id INTO _res_id;

    INSERT INTO public.investigators (name, email, pending_role, resource_id)
    VALUES ('Ming Zhan', 'ming.zhan@nih.gov', 'member', _res_id);
  END IF;
END $$;
