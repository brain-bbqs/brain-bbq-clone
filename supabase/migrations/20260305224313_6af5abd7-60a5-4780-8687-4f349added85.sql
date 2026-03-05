-- 1. Add user_id to investigators for identity linking
ALTER TABLE public.investigators
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create unique index so one user can only claim one investigator
CREATE UNIQUE INDEX IF NOT EXISTS investigators_user_id_unique ON public.investigators(user_id) WHERE user_id IS NOT NULL;

-- 2. Add created_by to resources for ownership tracking
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Auto-link function: match investigators to users by email on signup
CREATE OR REPLACE FUNCTION public.auto_link_investigator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.investigators
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Trigger on profiles insert (fires after handle_new_user creates the profile)
DROP TRIGGER IF EXISTS on_profile_created_link_investigator ON public.profiles;
CREATE TRIGGER on_profile_created_link_investigator
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_investigator();

-- 4. Security definer function to check if user owns an investigator
CREATE OR REPLACE FUNCTION public.user_owns_investigator(_user_id uuid, _investigator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.investigators
    WHERE id = _investigator_id AND user_id = _user_id
  )
$$;

-- 5. Security definer function to check if user created a resource
CREATE OR REPLACE FUNCTION public.user_owns_resource(_user_id uuid, _resource_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.resources
    WHERE id = _resource_id AND created_by = _user_id
  )
$$;