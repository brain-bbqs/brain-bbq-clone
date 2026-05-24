
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
      'x-internal-token', current_setting('app.ci_auth_secret', true)
    ),
    body := '{"providers":["github","supabase","lovable"]}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
