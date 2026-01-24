-- Add cover_image_url column to user_profiles for cross-device persistence
ALTER TABLE public.user_profiles 
ADD COLUMN cover_image_url TEXT;