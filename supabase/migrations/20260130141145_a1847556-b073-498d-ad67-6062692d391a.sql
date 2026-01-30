-- Add a public profile viewing policy that allows anyone to view basic profile info
-- This enables Director Profile pages to be publicly viewable
-- We use a more permissive SELECT policy that allows viewing any profile with show_on_leaderboard OR show_collaboration_info
DROP POLICY IF EXISTS "Public can view leaderboard profiles" ON public.user_profiles;

CREATE POLICY "Public can view visible profiles"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR show_on_leaderboard = true 
  OR show_collaboration_info = true
);