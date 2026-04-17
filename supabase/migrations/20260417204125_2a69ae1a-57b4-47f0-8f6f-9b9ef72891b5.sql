INSERT INTO public.user_roles (user_id, role)
VALUES ('860fa867-f72c-40a2-845b-5f68c5906dec', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;