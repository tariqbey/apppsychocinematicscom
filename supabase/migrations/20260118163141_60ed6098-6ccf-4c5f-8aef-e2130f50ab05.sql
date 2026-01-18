-- Add episode_character_transformation column to store the required character analysis
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS character_transformation JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.episodes.character_transformation IS 'Stores the required character profile for this episode including traits, behaviors, mindset, gap analysis, and transformation milestones';