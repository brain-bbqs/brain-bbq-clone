
-- Add umassmed.edu to allowed domains
INSERT INTO public.allowed_domains (domain, organization_id)
VALUES ('umassmed.edu', '9ca8b1b0-6c1d-4f27-ac46-664685ebb136')
ON CONFLICT DO NOTHING;

-- Add meaghan.perdue@umassmed.edu to Meaghan Perdue's secondary emails
UPDATE public.investigators
SET secondary_emails = array_append(COALESCE(secondary_emails, ARRAY[]::text[]), 'meaghan.perdue@umassmed.edu'),
    updated_at = now()
WHERE lower(name) LIKE '%perdue%'
  AND NOT ('meaghan.perdue@umassmed.edu' = ANY(COALESCE(secondary_emails, ARRAY[]::text[])));
