
-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  department TEXT,
  location TEXT,
  job_type TEXT NOT NULL DEFAULT 'postdoc',
  description TEXT,
  contact_name TEXT,
  contact_email TEXT,
  application_url TEXT,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  posted_by_email TEXT,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active jobs
CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (is_active = true);

-- Authenticated users can post jobs
CREATE POLICY "Authenticated users can post jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = posted_by);

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = posted_by);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = posted_by);

-- Index for active jobs
CREATE INDEX idx_jobs_active ON public.jobs (is_active, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
