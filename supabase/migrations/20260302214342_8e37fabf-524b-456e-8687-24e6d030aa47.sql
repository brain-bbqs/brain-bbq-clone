
-- Create paper_extractions table for storing uploaded paper metadata + extracted entities
CREATE TABLE public.paper_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  storage_path text,
  status text NOT NULL DEFAULT 'pending',
  raw_text text,
  -- LinkML-aligned extracted entities
  title text,
  authors text,
  doi text,
  grant_numbers text[] DEFAULT '{}',
  orcids text[] DEFAULT '{}',
  study_species text[] DEFAULT '{}',
  use_sensors text[] DEFAULT '{}',
  use_approaches text[] DEFAULT '{}',
  produce_data_modality text[] DEFAULT '{}',
  produce_data_type text[] DEFAULT '{}',
  use_analysis_method text[] DEFAULT '{}',
  use_analysis_types text[] DEFAULT '{}',
  develope_software_type text[] DEFAULT '{}',
  develope_hardware_type text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  extracted_metadata jsonb DEFAULT '{}'::jsonb,
  chat_messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paper_extractions ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users manage their own extractions
CREATE POLICY "Users can view their own extractions"
  ON public.paper_extractions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extractions"
  ON public.paper_extractions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extractions"
  ON public.paper_extractions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extractions"
  ON public.paper_extractions FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_paper_extractions_updated_at
  BEFORE UPDATE ON public.paper_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for uploaded PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('paper-uploads', 'paper-uploads', false);

-- Storage policies
CREATE POLICY "Users can upload their own papers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'paper-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own papers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'paper-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own papers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'paper-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
