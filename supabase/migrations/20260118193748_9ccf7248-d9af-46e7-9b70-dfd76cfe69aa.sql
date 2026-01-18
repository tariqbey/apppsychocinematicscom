-- Add columns to store challenge storyboard data for persistence
ALTER TABLE public.adversity_challenges
ADD COLUMN IF NOT EXISTS storyboard_scenes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS storyboard_reference_photo TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS storyboard_created_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.adversity_challenges.storyboard_scenes IS 'JSON array of storyboard scenes with images/videos';
COMMENT ON COLUMN public.adversity_challenges.storyboard_reference_photo IS 'Reference photo URL used for storyboard generation';
COMMENT ON COLUMN public.adversity_challenges.storyboard_created_at IS 'When the storyboard was created/last updated';