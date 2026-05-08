
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='reconcile-nih-pis-weekly') THEN
    PERFORM cron.unschedule('reconcile-nih-pis-weekly');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='reconcile-nih-pis-daily') THEN
    PERFORM cron.unschedule('reconcile-nih-pis-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='close-expired-funding-daily') THEN
    PERFORM cron.unschedule('close-expired-funding-daily');
  END IF;
END$$;

SELECT cron.schedule(
  'reconcile-nih-pis-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/nih-grants?action=reconcile',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U"}'::jsonb,
    body := '{"trigger":"daily_cron"}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'close-expired-funding-daily',
  '15 7 * * *',
  $$
  UPDATE public.funding_opportunities
     SET status = 'closed', updated_at = now()
   WHERE status <> 'closed'
     AND expiration_date IS NOT NULL
     AND expiration_date < CURRENT_DATE;
  $$
);
