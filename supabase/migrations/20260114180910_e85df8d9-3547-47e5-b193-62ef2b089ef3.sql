-- Add movie_url column to mind_movie_scripts for storing final exported videos
ALTER TABLE public.mind_movie_scripts 
ADD COLUMN IF NOT EXISTS movie_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Create index for faster active movie lookup
CREATE INDEX IF NOT EXISTS idx_mind_movie_scripts_active 
ON public.mind_movie_scripts(user_id, is_active) 
WHERE is_active = true;

-- Comment for clarity
COMMENT ON COLUMN public.mind_movie_scripts.movie_url IS 'URL to the final exported Mind Movie video';
COMMENT ON COLUMN public.mind_movie_scripts.is_active IS 'Whether this is the currently active Mind Movie for daily viewing';