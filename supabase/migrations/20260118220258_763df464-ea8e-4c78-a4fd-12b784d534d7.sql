-- Add character description fields to user_profiles for enhanced reference photo system
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS character_height TEXT,
ADD COLUMN IF NOT EXISTS character_weight TEXT,
ADD COLUMN IF NOT EXISTS character_build TEXT,
ADD COLUMN IF NOT EXISTS character_features TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_side_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_back_url TEXT;