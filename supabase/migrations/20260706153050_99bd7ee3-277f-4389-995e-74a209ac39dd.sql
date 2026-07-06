
CREATE OR REPLACE FUNCTION public.admin_get_last_logins()
RETURNS TABLE(user_id uuid, last_sign_in_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_curator_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT u.id, u.last_sign_in_at
    FROM auth.users u;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_last_logins() TO authenticated;
