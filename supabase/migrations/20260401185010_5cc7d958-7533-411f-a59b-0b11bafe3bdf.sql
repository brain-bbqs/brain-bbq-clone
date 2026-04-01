-- Add Dartmouth organization and allowed domain
INSERT INTO public.organizations (id, name)
VALUES (gen_random_uuid(), 'DARTMOUTH COLLEGE');

INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'dartmouth.edu', id FROM public.organizations WHERE name = 'DARTMOUTH COLLEGE';