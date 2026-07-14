-- Notify admins when a NEW access request is filed — PATH-INDEPENDENT.
--
-- The notification previously lived only in the globus-auth failed-sign-in path, so a
-- person who went straight to the /request-access intake form (no Globus sign-in
-- first) generated NO admin alert — confirmed 2026-07-14 when two real requests
-- (Latane Bullock, Jack Grinband) came in with globus_subject NULL and no auth_audit
-- rows, i.e. via the form directly. Moving the notification to an AFTER INSERT trigger
-- fires it exactly once per new pending request no matter the entry path: the intake
-- form, the upsert_access_request RPC, or the globus-auth auto-file (all INSERT a row).
-- Enrichment of an existing pending row is an UPDATE, so a follow-up form submission or
-- a sign-in retry does NOT re-notify.
--
-- Transport mirrors the KG's established pg_net pattern (see the nih-grants /
-- budget-sync cron migrations): net.http_post to an edge function with the public anon
-- key as apikey. notify-access-request is verify_jwt=false and only ever emails the
-- fixed admin address, so no service-role key is needed here.
--
-- KG migrations are NOT applied by `db push` — run this in the KG SQL editor
-- (project vpexxhfpvghlejljwpvt), and deploy the notify-access-request function.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/notify-access-request',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U"}'::jsonb,
    body := jsonb_build_object(
      'email',           NEW.email,
      'name',            COALESCE(NULLIF(btrim(NEW.full_name), ''), NEW.globus_name),
      'institution',     NEW.institution,
      'requested_role',  NEW.requested_role,
      'admin_url',       'https://brain-bbqs.org/admin?tab=access-requests'
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A notification failure must NEVER block the request from being filed.
  RAISE WARNING 'notify_new_access_request failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_access_request ON public.access_requests;
CREATE TRIGGER trg_notify_new_access_request
  AFTER INSERT ON public.access_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_new_access_request();
