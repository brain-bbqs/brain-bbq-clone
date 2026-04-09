
-- Create NIH organization
INSERT INTO public.organizations (id, name, url)
VALUES (gen_random_uuid(), 'National Institutes of Health', 'https://www.nih.gov')
ON CONFLICT DO NOTHING;

-- Add nih.gov domain
INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'nih.gov', id FROM public.organizations WHERE name = 'National Institutes of Health'
ON CONFLICT DO NOTHING;

-- Add mail.nih.gov domain (some NIH staff use this)
INSERT INTO public.allowed_domains (domain, organization_id)
SELECT 'mail.nih.gov', id FROM public.organizations WHERE name = 'National Institutes of Health'
ON CONFLICT DO NOTHING;
