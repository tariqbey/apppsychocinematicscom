-- Allow 'audio' as a valid media_type for generated_media
ALTER TABLE generated_media 
DROP CONSTRAINT generated_media_media_type_check;

ALTER TABLE generated_media 
ADD CONSTRAINT generated_media_media_type_check 
CHECK (media_type IN ('image', 'video', 'audio'));