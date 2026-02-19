
-- Link nih_grants_cache to grants table via grant_number
ALTER TABLE public.nih_grants_cache
ADD COLUMN grant_id UUID REFERENCES public.grants(id) ON DELETE SET NULL;

-- Create index for the foreign key
CREATE INDEX idx_nih_grants_cache_grant_id ON public.nih_grants_cache(grant_id);

-- Drop the community_mcp_servers table and its policies
DROP POLICY IF EXISTS "Anyone can view approved MCP servers" ON public.community_mcp_servers;
DROP POLICY IF EXISTS "Authenticated users can submit MCP servers" ON public.community_mcp_servers;
DROP POLICY IF EXISTS "Users can delete their pending submissions" ON public.community_mcp_servers;
DROP POLICY IF EXISTS "Users can update their pending submissions" ON public.community_mcp_servers;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.community_mcp_servers;
DROP TABLE public.community_mcp_servers;
