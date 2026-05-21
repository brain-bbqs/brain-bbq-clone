UPDATE public.investigators SET email = 'mansi@oeb.harvard.edu', role = COALESCE(role, 'Assistant Professor'), updated_at = now() WHERE id = 'eedc7ea5-6502-48f5-8203-e2c3da37778c';

UPDATE public.investigators SET email = 'david.schoppik@nyulangone.org', role = COALESCE(role, 'Assistant Professor'), updated_at = now() WHERE id = 'f8fcad5f-803a-4cd5-8e03-1d7604ca98f8';