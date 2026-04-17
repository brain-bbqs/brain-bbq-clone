INSERT INTO public.user_roles (user_id, role) VALUES
  ('b97c55a7-0c3b-4414-9762-dbd06a82c880', 'admin'),
  ('66d4c650-3b31-4b69-b500-e8f092293e01', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;