
DO $$
BEGIN
  -- Remove tables from Realtime publication if they exist
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.projects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'project_publications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.project_publications;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'project_resources'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.project_resources;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'edit_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.edit_history;
  END IF;
END $$;
