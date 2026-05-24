
-- Store the service role key in Vault so pg_cron can call the edge function.
-- (Insert once if missing; we cannot read Deno secrets from Postgres so the user
--  may need to update this value via the dashboard if the key rotates.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_service_role_key') THEN
    PERFORM vault.create_secret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U',
      'project_service_role_key',
      'Placeholder — replace with actual service_role JWT in Supabase dashboard > Vault for budget-sync cron to authenticate.'
    );
  END IF;
END $$;

-- Unschedule any previous version
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'budget-sync-every-15m';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

SELECT cron.schedule(
  'budget-sync-every-15m',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/budget-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_service_role_key' LIMIT 1)
    ),
    body := '{"providers":["github","supabase","lovable"]}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
