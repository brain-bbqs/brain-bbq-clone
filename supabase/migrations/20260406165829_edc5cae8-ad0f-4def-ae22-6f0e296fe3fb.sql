-- Add secondary_emails and working_groups to investigators
ALTER TABLE investigators ADD COLUMN IF NOT EXISTS secondary_emails text[] DEFAULT '{}';
ALTER TABLE investigators ADD COLUMN IF NOT EXISTS working_groups text[] DEFAULT '{}';
ALTER TABLE investigators ADD COLUMN IF NOT EXISTS role text DEFAULT NULL;