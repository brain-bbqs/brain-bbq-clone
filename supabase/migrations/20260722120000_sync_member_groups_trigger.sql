-- Profile edits reflect everywhere, as if the agent made them.
--
-- When a member's working_groups or role changes on the KG — by the member editing
-- their own profile, a curator/admin editing it, or the agent — their Google Group
-- memberships should follow automatically (add the new WG groups, remove the ones they
-- dropped, move between role groups). Profile edits are a DIRECT client-side write to
-- public.investigators (RLS-scoped), so a DB trigger is the only place that catches
-- every edit path. It fires the sync-member-groups edge function, which reconciles by
-- delta (old → new) and holds the Google creds.
--
-- Mirrors the KG's established pg_net trigger pattern (notify_new_access_request).
-- KG migrations are NOT applied by `db push` — run this in the KG SQL editor
-- (project vpexxhfpvghlejljwpvt), deploy the sync-member-groups function, and set its
-- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN secrets.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.sync_member_groups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nothing to sync without an email to key the Google membership on.
  IF NEW.email IS NULL OR btrim(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/sync-member-groups',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U"}'::jsonb,
    body := jsonb_build_object(
      'email', NEW.email,
      'old', jsonb_build_object('working_groups', OLD.working_groups, 'role', OLD.role),
      'new', jsonb_build_object('working_groups', NEW.working_groups, 'role', NEW.role)
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A sync failure must NEVER block the profile edit from saving.
  RAISE WARNING 'sync_member_groups failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_member_groups ON public.investigators;
CREATE TRIGGER trg_sync_member_groups
  AFTER UPDATE ON public.investigators
  FOR EACH ROW
  WHEN (
    OLD.working_groups IS DISTINCT FROM NEW.working_groups
    OR OLD.role IS DISTINCT FROM NEW.role
  )
  EXECUTE FUNCTION public.sync_member_groups();
