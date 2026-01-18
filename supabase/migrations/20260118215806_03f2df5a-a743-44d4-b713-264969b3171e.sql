-- Add visualization_script column to save generated scripts
ALTER TABLE public.adversity_challenges 
ADD COLUMN IF NOT EXISTS visualization_script TEXT,
ADD COLUMN IF NOT EXISTS ideal_response TEXT,
ADD COLUMN IF NOT EXISTS affirmation TEXT;