-- Add comprehensive Napoleon Hill self-analysis storage
ALTER TABLE public.character_profiles
ADD COLUMN IF NOT EXISTS napoleon_hill_law_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS napoleon_hill_analysis_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS napoleon_hill_strengths TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS napoleon_hill_weaknesses TEXT[] DEFAULT '{}';

-- Add index for analysis date to efficiently query for reminders
CREATE INDEX IF NOT EXISTS idx_character_profiles_analysis_date 
ON public.character_profiles(napoleon_hill_analysis_date);

-- Comment on columns for clarity
COMMENT ON COLUMN public.character_profiles.napoleon_hill_law_scores IS 'Stores scores (0-100) for each of the 17 Laws of Success';
COMMENT ON COLUMN public.character_profiles.napoleon_hill_analysis_date IS 'Date of last self-analysis completion - used for 21-day reminder';
COMMENT ON COLUMN public.character_profiles.napoleon_hill_strengths IS 'Top 3-5 laws where user scored highest';
COMMENT ON COLUMN public.character_profiles.napoleon_hill_weaknesses IS 'Bottom 3-5 laws where user needs improvement';