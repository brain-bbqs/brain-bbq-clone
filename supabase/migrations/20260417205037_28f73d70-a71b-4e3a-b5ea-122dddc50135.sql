-- 1. Trigger to auto-grant 'member' role on new user creation
CREATE OR REPLACE FUNCTION public.grant_default_member_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_member ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_default_member_role();

-- 2. Backfill: grant 'member' to all existing profiles that don't have it
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'member'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'member'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Allow admins to view all profiles (for admin panel)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Allow admins to view all role rows (already present via "Users can view own roles" OR clause, but make explicit policy too is unnecessary — already covered). Skip.
