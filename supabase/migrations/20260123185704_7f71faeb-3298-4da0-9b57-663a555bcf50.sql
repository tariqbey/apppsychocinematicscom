-- Add column to store the auto-generated character style sheet image URL
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS character_style_sheet_url TEXT;

-- Add column to track style sheet approval status
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS style_sheet_approved BOOLEAN DEFAULT FALSE;