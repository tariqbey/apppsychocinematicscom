-- Add image MIME types to mind-movies bucket to allow cover art uploads
UPDATE storage.buckets 
SET allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
WHERE id = 'mind-movies';