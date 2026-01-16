-- Add reference_photo_url column to mind_movie_scripts table
ALTER TABLE mind_movie_scripts 
ADD COLUMN reference_photo_url TEXT DEFAULT NULL;