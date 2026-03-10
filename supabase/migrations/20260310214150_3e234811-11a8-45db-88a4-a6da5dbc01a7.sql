
-- Create resource entries for all grants that don't have one yet, then link them.
-- We use a CTE to insert resources and immediately update grants.

-- Step 1: Insert resources for each grant
WITH new_resources AS (
  INSERT INTO public.resources (name, description, resource_type, external_url)
  SELECT 
    g.grant_number,
    g.title,
    'grant'::public.resource_type,
    g.nih_link
  FROM public.grants g
  WHERE g.resource_id IS NULL
  RETURNING id, name
)
-- Step 2: Link each grant to its new resource
UPDATE public.grants g
SET resource_id = nr.id, updated_at = now()
FROM new_resources nr
WHERE g.grant_number = nr.name
  AND g.resource_id IS NULL;
