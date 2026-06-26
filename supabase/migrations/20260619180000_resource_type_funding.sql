-- resources.resource_type is the public.resource_type ENUM. Add 'funding' so the agent's
-- resourceInsert can file funding-finder LINKS (shown in the "Funding resources" strip atop
-- the /grants page), distinct from the structured NIH FOA catalog. Idempotent.
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'funding';
