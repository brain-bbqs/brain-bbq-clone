-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Table to store paper extraction metadata
CREATE TABLE public.ner_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id TEXT NOT NULL,
  pmid TEXT,
  doi TEXT,
  paper_title TEXT NOT NULL,
  abstract TEXT,
  grant_number TEXT,
  extraction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  schema_version TEXT NOT NULL DEFAULT '2.0',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  extracted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pmid)
);

-- Table to store individual extracted entities with embeddings
CREATE TABLE public.ner_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extraction_id UUID NOT NULL REFERENCES public.ner_extractions(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  label TEXT NOT NULL,
  marr_level TEXT NOT NULL CHECK (marr_level IN ('L1', 'L2', 'L3')),
  marr_level_name TEXT NOT NULL CHECK (marr_level_name IN ('computational', 'algorithmic', 'implementational')),
  ontology_id TEXT,
  ontology_label TEXT,
  marr_rationale TEXT,
  context_sentences JSONB DEFAULT '[]'::jsonb,
  paper_location JSONB DEFAULT '[]'::jsonb,
  judge_scores JSONB DEFAULT '[]'::jsonb,
  remarks JSONB DEFAULT '[]'::jsonb,
  embedding extensions.vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ner_extractions_pmid ON public.ner_extractions(pmid);
CREATE INDEX idx_ner_extractions_grant ON public.ner_extractions(grant_number);
CREATE INDEX idx_ner_extractions_status ON public.ner_extractions(status);
CREATE INDEX idx_ner_entities_extraction ON public.ner_entities(extraction_id);
CREATE INDEX idx_ner_entities_marr_level ON public.ner_entities(marr_level);
CREATE INDEX idx_ner_entities_label ON public.ner_entities(label);

-- Vector similarity search index (IVFFlat for approximate nearest neighbor)
CREATE INDEX idx_ner_entities_embedding ON public.ner_entities 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.ner_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ner_entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies - authenticated users can read all extractions
CREATE POLICY "Authenticated users can view extractions"
ON public.ner_extractions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert extractions"
ON public.ner_extractions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = extracted_by);

CREATE POLICY "Users can update their own extractions"
ON public.ner_extractions FOR UPDATE
TO authenticated
USING (auth.uid() = extracted_by);

-- Entity policies
CREATE POLICY "Authenticated users can view entities"
ON public.ner_entities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert entities"
ON public.ner_entities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ner_extractions 
    WHERE id = extraction_id AND extracted_by = auth.uid()
  )
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for timestamp updates
CREATE TRIGGER update_ner_extractions_updated_at
BEFORE UPDATE ON public.ner_extractions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function for semantic similarity search
CREATE OR REPLACE FUNCTION public.search_entities_by_similarity(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  entity TEXT,
  label TEXT,
  marr_level TEXT,
  ontology_id TEXT,
  context_sentences JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
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
$$;