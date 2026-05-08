-- Remove any prior version of the job so this migration is idempotent.
DO $$
DECLARE _jobid bigint;
BEGIN
  SELECT jobid INTO _jobid FROM cron.job WHERE jobname = 'reconcile-nih-pis-weekly';
  IF _jobid IS NOT NULL THEN
    PERFORM cron.unschedule(_jobid);
  END IF;
END $$;

-- Schedule weekly PI reconciliation (Mondays 07:00 UTC).
SELECT cron.schedule(
  'reconcile-nih-pis-weekly',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/nih-grants?action=reconcile',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U"}'::jsonb,
    body := '{"trigger":"weekly_cron"}'::jsonb
  ) AS request_id;
  $$
);