
ALTER TABLE public.knowledge_embeddings DROP CONSTRAINT IF EXISTS knowledge_embeddings_source_type_check;

ALTER TABLE public.knowledge_embeddings ADD CONSTRAINT knowledge_embeddings_source_type_check 
CHECK (source_type IN ('project', 'publication', 'investigator', 'tool', 'workflow', 'cross_project_workflow'));
