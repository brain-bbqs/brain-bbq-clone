-- Single writer for access_requests: upsert_access_request()
--
-- Both entry points now go through ONE SECURITY DEFINER function:
--   • the failed Globus sign-in path (globus-auth edge fn, service role) auto-files a
--     bare pending request the moment a would-be member is turned away, so the attempt
--     becomes an actionable approval item even if they never finish the intake form;
--   • the /request-access intake form (anon) submits the full details.
--
-- The function keeps AT MOST ONE pending row per email (matching the
-- access_requests_one_pending_per_email partial unique index) and ENRICHES that row
-- instead of colliding: a later, richer submission fills in fields the earlier one
-- left null, and non-null incoming values win. This is what makes auto-filing safe —
-- it was removed before precisely because a bare auto-file + a form submission created
-- two rows (or, with the unique index, dropped the form's institution/role as a 23505
-- conflict). was_created lets callers notify admins exactly ONCE per person (retries
-- and the follow-up form submission return was_created=false).
--
-- KG migrations are NOT applied by `db push` — run this in the KG SQL editor
-- (project vpexxhfpvghlejljwpvt). Callers degrade gracefully if it isn't applied yet:
-- globus-auth logs the RPC error and still redirects; the intake form falls back to a
-- direct insert (PGRST202 → old behavior).

CREATE OR REPLACE FUNCTION public.upsert_access_request(
  _email          text,
  _full_name      text DEFAULT NULL,
  _institution    text DEFAULT NULL,
  _requested_role text DEFAULT NULL,
  _message        text DEFAULT NULL,
  _globus_name    text DEFAULT NULL,
  _globus_subject text DEFAULT NULL
)
RETURNS TABLE (id uuid, was_created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_id uuid;
BEGIN
  IF _email IS NULL OR btrim(_email) = '' THEN
    RAISE EXCEPTION 'email is required';
  END IF;

  -- Enrich an existing pending request for this email, if one exists.
  SELECT ar.id INTO _existing_id
    FROM public.access_requests ar
   WHERE lower(ar.email) = lower(_email)
     AND ar.status = 'pending'
   ORDER BY ar.updated_at DESC NULLS LAST, ar.created_at DESC NULLS LAST
   LIMIT 1;

  IF _existing_id IS NOT NULL THEN
    UPDATE public.access_requests ar SET
      full_name      = COALESCE(NULLIF(btrim(_full_name), ''), ar.full_name),
      institution    = COALESCE(NULLIF(btrim(_institution), ''), ar.institution),
      requested_role = COALESCE(NULLIF(btrim(_requested_role), ''), ar.requested_role),
      message        = COALESCE(NULLIF(btrim(_message), ''), ar.message),
      globus_name    = COALESCE(NULLIF(btrim(_globus_name), ''), ar.globus_name),
      globus_subject = COALESCE(NULLIF(btrim(_globus_subject), ''), ar.globus_subject),
      updated_at     = now()
     WHERE ar.id = _existing_id;
    RETURN QUERY SELECT _existing_id, false;
    RETURN;
  END IF;

  -- No pending row yet — insert one. Guard against a concurrent insert racing us to
  -- the unique index: fold into the row that won instead of erroring.
  BEGIN
    RETURN QUERY
      INSERT INTO public.access_requests
        (email, full_name, institution, requested_role, message, globus_name, globus_subject, status)
      VALUES
        (lower(_email),
         NULLIF(btrim(_full_name), ''),
         NULLIF(btrim(_institution), ''),
         NULLIF(btrim(_requested_role), ''),
         NULLIF(btrim(_message), ''),
         NULLIF(btrim(_globus_name), ''),
         NULLIF(btrim(_globus_subject), ''),
         'pending')
      RETURNING access_requests.id, true;
  EXCEPTION WHEN unique_violation THEN
    SELECT ar.id INTO _existing_id
      FROM public.access_requests ar
     WHERE lower(ar.email) = lower(_email) AND ar.status = 'pending'
     LIMIT 1;
    UPDATE public.access_requests ar SET
      full_name      = COALESCE(NULLIF(btrim(_full_name), ''), ar.full_name),
      institution    = COALESCE(NULLIF(btrim(_institution), ''), ar.institution),
      requested_role = COALESCE(NULLIF(btrim(_requested_role), ''), ar.requested_role),
      message        = COALESCE(NULLIF(btrim(_message), ''), ar.message),
      globus_name    = COALESCE(NULLIF(btrim(_globus_name), ''), ar.globus_name),
      globus_subject = COALESCE(NULLIF(btrim(_globus_subject), ''), ar.globus_subject),
      updated_at     = now()
     WHERE ar.id = _existing_id;
    RETURN QUERY SELECT _existing_id, false;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_access_request(text, text, text, text, text, text, text)
  TO anon, authenticated, service_role;
