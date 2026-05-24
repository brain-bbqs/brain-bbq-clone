
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('ember-dandiset-sync-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ember-dandiset-sync-daily');

SELECT cron.schedule(
  'ember-dandiset-sync-daily',
  '17 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/ember-dandiset-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U'
    ),
    body := '{}'::jsonb
  );
  $$
);
