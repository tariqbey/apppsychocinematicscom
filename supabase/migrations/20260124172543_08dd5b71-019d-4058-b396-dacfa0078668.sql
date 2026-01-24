-- Add banner_image_url column to featured_content table
ALTER TABLE public.featured_content 
ADD COLUMN IF NOT EXISTS banner_image_url text;