UPDATE resources 
SET metadata = jsonb_set(metadata::jsonb, '{repoUrl}', '"https://github.com/lambdaloop/anipose"')
WHERE name = 'Anipose';