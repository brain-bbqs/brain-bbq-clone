
-- Create storage bucket for audio files and spectrograms
INSERT INTO storage.buckets (id, name, public) VALUES ('neuromcp-audio', 'neuromcp-audio', true);

-- Allow authenticated MIT users to upload audio files
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'neuromcp-audio'
  AND auth.role() = 'authenticated'
);

-- Allow public read access to spectrograms and audio
CREATE POLICY "Public read access for neuromcp-audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'neuromcp-audio');

-- Allow service role to manage files
CREATE POLICY "Service role can manage neuromcp-audio"
ON storage.objects FOR ALL
USING (bucket_id = 'neuromcp-audio')
WITH CHECK (bucket_id = 'neuromcp-audio');
