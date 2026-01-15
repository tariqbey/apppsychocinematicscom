-- Update Mind Movies storage bucket file size limit to 5GB
UPDATE storage.buckets 
SET file_size_limit = 5368709120 
WHERE id = 'mind-movies';