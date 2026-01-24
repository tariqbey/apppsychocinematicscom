-- Fix: Allow reading limited profile data for users who opted into leaderboard
-- The public_profiles view (with security_invoker=true) already limits which columns are exposed
-- This policy allows reading any profile row where show_on_leaderboard = true

-- Add policy to allow reading public profile data for opted-in users
CREATE POLICY "Public can view leaderboard profiles"
ON public.user_profiles
FOR SELECT
USING (
  -- Allow users to read their own profile (regardless of show_on_leaderboard)
  auth.uid() = user_id
  OR
  -- Allow anyone (authenticated) to read profiles that opted into leaderboard
  -- The view filters columns to only safe fields
  show_on_leaderboard = true
);

-- Note: The existing "Users can view own full profile" policy overlaps with this
-- We can drop it since this new policy covers both cases
DROP POLICY IF EXISTS "Users can view own full profile" ON public.user_profiles;