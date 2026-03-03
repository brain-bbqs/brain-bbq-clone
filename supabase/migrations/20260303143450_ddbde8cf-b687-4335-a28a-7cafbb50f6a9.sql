
-- Create a computational knowledge graph triple store
CREATE TABLE public.computational_triples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT 'entity',
  object_type TEXT NOT NULL DEFAULT 'entity',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.computational_triples ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read computational triples"
ON public.computational_triples
FOR SELECT
USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert computational triples"
ON public.computational_triples
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update computational triples"
ON public.computational_triples
FOR UPDATE
TO authenticated
USING (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete computational triples"
ON public.computational_triples
FOR DELETE
TO authenticated
USING (true);

-- Indexes for efficient querying
CREATE INDEX idx_comp_triples_subject ON public.computational_triples(subject);
CREATE INDEX idx_comp_triples_predicate ON public.computational_triples(predicate);
CREATE INDEX idx_comp_triples_object ON public.computational_triples(object);
CREATE INDEX idx_comp_triples_subject_type ON public.computational_triples(subject_type);

-- Trigger for updated_at
CREATE TRIGGER update_computational_triples_updated_at
BEFORE UPDATE ON public.computational_triples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
