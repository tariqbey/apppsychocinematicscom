-- Fix the view to use SECURITY INVOKER (the caller's permissions)
-- This ensures the view respects the RLS policies on the underlying table
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  bio,
  current_streak,
  best_streak,
  show_on_leaderboard
FROM public.user_profiles
WHERE show_on_leaderboard = true;

-- Re-grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;