
-- 1) Add pending_role column to investigators (used to grant role on first sign-in)
ALTER TABLE public.investigators
  ADD COLUMN IF NOT EXISTS pending_role app_role;

-- 2) Allow admins/curators to INSERT investigator rows (for invites)
DROP POLICY IF EXISTS "Admins and curators can insert investigators" ON public.investigators;
CREATE POLICY "Admins and curators can insert investigators"
ON public.investigators
FOR INSERT
TO authenticated
WITH CHECK (public.is_curator_or_admin(auth.uid()));

-- 3) Update auto_link_investigator trigger to also apply pending_role on first sign-in
CREATE OR REPLACE FUNCTION public.auto_link_investigator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _pending app_role;
  _inv_id uuid;
BEGIN
  -- Find a matching unlinked investigator with same email
  SELECT id, pending_role INTO _inv_id, _pending
  FROM public.investigators
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL
  LIMIT 1;

  IF _inv_id IS NOT NULL THEN
    UPDATE public.investigators
       SET user_id = NEW.id,
           pending_role = NULL
     WHERE id = _inv_id;

    IF _pending IS NOT NULL AND _pending <> 'member' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, _pending)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
