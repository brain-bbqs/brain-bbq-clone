
-- Community MCP server registry
CREATE TABLE public.community_mcp_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT NOT NULL,
  url TEXT NOT NULL,
  transport TEXT NOT NULL DEFAULT 'streamable-http',
  tools TEXT[] NOT NULL DEFAULT '{}',
  species TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  github_url TEXT,
  pip_package TEXT
);

-- Enable RLS
ALTER TABLE public.community_mcp_servers ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved servers
CREATE POLICY "Anyone can view approved MCP servers"
ON public.community_mcp_servers
FOR SELECT
USING (status = 'approved');

-- Authenticated users can also see their own pending submissions
CREATE POLICY "Users can view their own submissions"
ON public.community_mcp_servers
FOR SELECT
USING (auth.uid() = submitted_by);

-- Authenticated users can submit
CREATE POLICY "Authenticated users can submit MCP servers"
ON public.community_mcp_servers
FOR INSERT
WITH CHECK (auth.uid() = submitted_by);

-- Users can update their own pending submissions
CREATE POLICY "Users can update their pending submissions"
ON public.community_mcp_servers
FOR UPDATE
USING (auth.uid() = submitted_by AND status = 'pending');

-- Users can delete their own pending submissions
CREATE POLICY "Users can delete their pending submissions"
ON public.community_mcp_servers
FOR DELETE
USING (auth.uid() = submitted_by AND status = 'pending');
