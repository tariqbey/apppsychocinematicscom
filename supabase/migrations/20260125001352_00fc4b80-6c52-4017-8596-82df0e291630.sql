-- Add visibility controls to director_posts for sharing restrictions
ALTER TABLE public.director_posts
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
ADD COLUMN IF NOT EXISTS shared_with_user_ids UUID[] DEFAULT '{}';

-- Create index for faster filtering on visibility
CREATE INDEX IF NOT EXISTS idx_director_posts_visibility ON public.director_posts(visibility);

-- Drop old public view policy and create new visibility-aware policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.director_posts;

-- Users can view:
-- 1. Public posts (visibility = 'public')
-- 2. Their own posts (any visibility)
-- 3. Posts shared specifically with them (their user_id is in shared_with_user_ids)
CREATE POLICY "Users can view allowed posts" 
ON public.director_posts 
FOR SELECT 
USING (
  visibility = 'public' 
  OR auth.uid() = user_id 
  OR auth.uid() = ANY(shared_with_user_ids)
);

-- Add comment explaining visibility values
COMMENT ON COLUMN public.director_posts.visibility IS 'Post visibility: public (everyone), private (only owner), or specific (only shared_with_user_ids)';
COMMENT ON COLUMN public.director_posts.shared_with_user_ids IS 'Array of user IDs that can view this post when visibility is specific';