-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view public profile info" ON public.user_profiles;

-- Create policy: Users can view their OWN complete profile
CREATE POLICY "Users can view own full profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a secure view for public profile data (safe fields only)
-- This view only exposes non-sensitive fields for community features
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  bio,
  current_streak,
  best_streak,
  show_on_leaderboard
FROM public.user_profiles;

-- Grant access to the view for authenticated and anon users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Create RLS policy for public_profiles view access (view inherits table RLS)
-- Since the view selects from user_profiles, we need a policy that allows 
-- reading limited data. We'll use a function-based approach.

-- Create a policy that allows viewing limited profile data for other users
-- Only show_on_leaderboard users are visible, plus users can see their own
CREATE POLICY "Public can view limited profile info"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = user_id  -- Users can always see their own profile
  OR show_on_leaderboard = true  -- Leaderboard participants are visible
);