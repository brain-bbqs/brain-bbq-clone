UPDATE nih_grants_cache 
SET data = jsonb_set(data, '{institution}', '"Stony Brook Medicine"'), updated_at = now()
WHERE grant_number = '1R61MH138612';