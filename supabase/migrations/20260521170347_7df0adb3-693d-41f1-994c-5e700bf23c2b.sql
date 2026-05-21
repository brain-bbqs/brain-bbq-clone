
-- Add primary emails to existing investigator profiles (manual curation)
UPDATE public.investigators SET email = 'Sima.Mofakham@stonybrookmedicine.edu', updated_at = now()
  WHERE id IN ('a1b2c3d4-0003-4000-8000-000000000001','e74dafda-7c4d-45d0-a927-edb0ea2f8291');

UPDATE public.investigators SET email = 'Charles.Mikell@stonybrookmedicine.edu', updated_at = now()
  WHERE id = '77a87341-bee7-40c7-bb8f-a33a8950008e';

UPDATE public.investigators SET email = 'Petar.Djuric@stonybrook.edu', updated_at = now()
  WHERE id = 'd88983b7-8760-4b2a-9185-31b7eb1f9009';

UPDATE public.investigators SET email = 'satra@mit.edu', updated_at = now()
  WHERE id = '8baebd5b-7d23-49cf-afe8-a9c97c16808e';
