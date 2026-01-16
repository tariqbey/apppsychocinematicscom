-- Drop the existing public view policy and recreate remaining policies
DROP POLICY IF EXISTS "Public can view generated-media" ON storage.objects;

-- Recreate SELECT policy for public viewing
CREATE POLICY "Public can view generated-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-media');

-- Create UPDATE policy for users to update their own files
CREATE POLICY "Users can update generated-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'generated-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create DELETE policy for users to delete their own files
CREATE POLICY "Users can delete generated-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);