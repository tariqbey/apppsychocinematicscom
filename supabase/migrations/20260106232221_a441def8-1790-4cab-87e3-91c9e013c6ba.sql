-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to generated images
CREATE POLICY "Generated images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');

-- Allow authenticated users to upload generated images
CREATE POLICY "Users can upload generated images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images');