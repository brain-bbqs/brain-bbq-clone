
-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule weekly security audit: Mondays at 06:00 UTC
SELECT cron.schedule(
  'weekly-security-audit',
  '0 6 * * 1',
  $$
  SELECT
    net.http_post(
      url := 'https://vpexxhfpvghlejljwpvt.supabase.co/functions/v1/security-audit',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZXh4aGZwdmdobGVqbGp3cHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg2NDUsImV4cCI6MjA4NTI4NDY0NX0.M107rJ9Ji17zAyd8Jolt5GQFZmu9vvAG1UiIq0GQh8U"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
