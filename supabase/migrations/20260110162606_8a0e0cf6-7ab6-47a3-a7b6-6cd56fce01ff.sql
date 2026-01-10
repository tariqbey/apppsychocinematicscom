-- Create the generated-media storage bucket for voice-changed audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-media', 'generated-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the generated-media bucket
CREATE POLICY "Users can upload their own voice-changed audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-media' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "Users can view their own voice-changed audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-media' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "Public can view generated-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-media');