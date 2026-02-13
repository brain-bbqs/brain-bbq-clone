
CREATE OR REPLACE FUNCTION public.search_knowledge_embeddings(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  source_type text,
  source_id text,
  title text,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.source_type,
    ke.source_id,
    ke.title,
    ke.content,
    ke.metadata,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_embeddings ke
  WHERE 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_entities_by_similarity(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  entity text,
  label text,
  marr_level text,
  ontology_id text,
  context_sentences jsonb,
  similarity double precision
)
LANGUAGE plpgsql
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.entity,
    e.label,
    e.marr_level,
    e.ontology_id,
    e.context_sentences,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.ner_entities e
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
