-- 1. Add FK column linking knowledge_embeddings to resources
ALTER TABLE public.knowledge_embeddings
  ADD COLUMN resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL;

-- 2. Backfill from existing source_id where it's a valid resource UUID
UPDATE public.knowledge_embeddings ke
SET resource_id = r.id
FROM public.resources r
WHERE ke.source_id = r.id::text;

-- 3. Index for performance
CREATE INDEX idx_knowledge_embeddings_resource_id
  ON public.knowledge_embeddings(resource_id);