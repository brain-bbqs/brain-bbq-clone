ALTER TABLE public.grant_methods_traversal_paths REPLICA IDENTITY FULL;
ALTER TABLE public.grant_methods_evidence REPLICA IDENTITY FULL;
ALTER TABLE public.harvester_runs REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.grant_methods_traversal_paths; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.grant_methods_evidence; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.harvester_runs; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;