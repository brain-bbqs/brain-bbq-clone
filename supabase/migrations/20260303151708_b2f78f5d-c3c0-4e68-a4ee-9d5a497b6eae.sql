
-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  link text,
  link_text text,
  is_external_link boolean NOT NULL DEFAULT false,
  posted_by uuid REFERENCES auth.users(id),
  posted_by_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can view announcements
CREATE POLICY "Anyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

-- Authenticated users can post announcements
CREATE POLICY "Authenticated users can post announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = posted_by);

-- Users can update their own announcements
CREATE POLICY "Users can update their own announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (auth.uid() = posted_by);

-- Users can delete their own announcements
CREATE POLICY "Users can delete their own announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (auth.uid() = posted_by);

-- Timestamp trigger
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing announcements
INSERT INTO public.announcements (title, content, link, link_text, is_external_link) VALUES
('Children''s Speech Recognition Challenge — $120K Prize Pool',
 'DrivenData has launched the "On Top of Pasketti" Children''s Speech Recognition Challenge, focused on building open, high-quality ASR models for children''s speech. Participants work with ~560K transcribed utterances (519 hours of child speech). Two tracks: Word-level ASR and Phonetic ASR. Open through April 6, 2026.',
 'https://kidsasr.drivendata.org/', 'Learn more & participate', true),
('Canada Impact+ Research Training Awards (CIRTA)',
 'McGill University is accepting nominations for the Canada Impact+ Research Training Awards — a one-time initiative to recruit international or returning Canadian doctoral students ($40K/yr × 3 years, 600 awards) and postdoctoral researchers ($70K/yr × 2 years, 400 awards). Priority areas include AI, health/biotech, clean tech, climate resilience, and more.',
 '/jobs', 'View on Job Board', false),
('SFN Annual Meeting 2025',
 'BBQS will be presenting at the Society for Neuroscience Annual Meeting in San Diego. Join us at Booth #3830 and #3831 or attend our symposium.',
 '/sfn-2025', 'More details', false),
('Consortia-Wide Workshop at MIT',
 'A 3-day Consortia-Wide Workshop will be held at MIT from July 15-17, 2025. Consortia members, please check your messages for signup information and further details.',
 NULL, NULL, false),
('New BBQS Website Launch',
 'A new website for BBQS (this) was born. 🎊',
 NULL, NULL, false);
