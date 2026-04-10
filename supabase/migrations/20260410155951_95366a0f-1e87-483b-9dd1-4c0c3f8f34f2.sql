
-- Table for tracking failed authentication attempts
CREATE TABLE public.auth_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempted_email TEXT,
  globus_name TEXT,
  error_reason TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (edge function uses service role key)
-- No public read/write access
COMMENT ON TABLE public.auth_audit_log IS 'Tracks failed Globus authentication attempts for admin review';
