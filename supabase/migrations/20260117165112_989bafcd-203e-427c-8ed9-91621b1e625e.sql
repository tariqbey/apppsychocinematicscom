-- Add column to store the Chief Aim snapshot used when generating the transformation analysis
ALTER TABLE public.character_profiles 
ADD COLUMN IF NOT EXISTS transformation_chief_aim_snapshot JSONB DEFAULT NULL;

-- Add column to track which cycle the analysis was generated in
ALTER TABLE public.character_profiles 
ADD COLUMN IF NOT EXISTS transformation_cycle_number INTEGER DEFAULT NULL;