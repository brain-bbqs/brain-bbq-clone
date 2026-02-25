
-- Backfill profiles for existing users
INSERT INTO public.profiles (id, email, full_name, organization_id)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  (SELECT ad.organization_id FROM public.allowed_domains ad WHERE ad.domain = split_part(u.email, '@', 2) LIMIT 1)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
