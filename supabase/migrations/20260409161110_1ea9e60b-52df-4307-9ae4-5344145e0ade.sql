
-- Create resource node for Crystal Lantz
INSERT INTO public.resources (id, name, resource_type, description)
VALUES (
  gen_random_uuid(),
  'Crystal Lantz',
  'investigator',
  'NIH Program staff – BBQS consortium'
);

-- Insert Crystal Lantz as investigator
INSERT INTO public.investigators (name, email, role, resource_id)
SELECT
  'Crystal Lantz',
  'crystal.lantz@nih.gov',
  'NIH Program',
  r.id
FROM public.resources r
WHERE r.name = 'Crystal Lantz' AND r.resource_type = 'investigator'
ORDER BY r.created_at DESC
LIMIT 1;
