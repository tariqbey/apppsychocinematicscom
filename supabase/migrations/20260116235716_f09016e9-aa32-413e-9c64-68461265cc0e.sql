-- Drop the existing INSERT policy that only checks folder segment [2]
DROP POLICY IF EXISTS "Users can upload their own voice-changed audio" ON storage.objects;

-- Drop the UPDATE and DELETE policies we just created to recreate with flexible owner check
DROP POLICY IF EXISTS "Users can update generated-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete generated-media" ON storage.objects;

-- Create INSERT policy supporting both folder structures: <uid>/... AND voice-changed/<uid>/...
CREATE POLICY "Users can upload to generated-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-media' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Create UPDATE policy with same flexible owner check
CREATE POLICY "Users can update generated-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'generated-media' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Create DELETE policy with same flexible owner check
CREATE POLICY "Users can delete generated-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-media' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);