-- Add DELETE policies for ner_entities
CREATE POLICY "Users can delete entities from their extractions"
ON public.ner_entities
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM ner_extractions
  WHERE ner_extractions.id = ner_entities.extraction_id
  AND ner_extractions.extracted_by = auth.uid()
));

-- Add DELETE policy for ner_extractions
CREATE POLICY "Users can delete their own extractions"
ON public.ner_extractions
FOR DELETE
USING (auth.uid() = extracted_by);