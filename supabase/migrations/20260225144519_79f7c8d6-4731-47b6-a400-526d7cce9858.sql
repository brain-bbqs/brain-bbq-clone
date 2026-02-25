
-- Rename project_metadata table to projects
ALTER TABLE public.project_metadata RENAME TO projects;

-- Add dynamic metadata JSONB column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Rename the trigger to match new table name
DROP TRIGGER IF EXISTS update_project_metadata_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Rename constraint (foreign key automatically follows the table rename)
-- RLS policies automatically follow the table rename as well
