
-- Create resources for each job that doesn't have one yet
DO $$
DECLARE
  j RECORD;
  new_resource_id uuid;
BEGIN
  FOR j IN SELECT * FROM public.jobs WHERE resource_id IS NULL
  LOOP
    INSERT INTO public.resources (name, resource_type, description, external_url, metadata)
    VALUES (
      j.title,
      'job',
      j.description,
      j.application_url,
      jsonb_build_object('institution', j.institution, 'department', j.department, 'location', j.location, 'job_type', j.job_type)
    )
    RETURNING id INTO new_resource_id;

    UPDATE public.jobs SET resource_id = new_resource_id WHERE id = j.id;
  END LOOP;

  -- Create resources for each announcement that doesn't have one yet
  FOR j IN SELECT * FROM public.announcements WHERE resource_id IS NULL
  LOOP
    INSERT INTO public.resources (name, resource_type, description, external_url, metadata)
    VALUES (
      j.title,
      'announcement',
      j.content,
      CASE WHEN j.is_external_link THEN j.link ELSE NULL END,
      jsonb_build_object('link', j.link, 'link_text', j.link_text, 'is_external', j.is_external_link)
    )
    RETURNING id INTO new_resource_id;

    UPDATE public.announcements SET resource_id = new_resource_id WHERE id = j.id;
  END LOOP;
END $$;
