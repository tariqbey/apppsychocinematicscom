-- Fix public_profiles view to remove bio field (personal information)
-- Must drop and recreate since PostgreSQL doesn't allow dropping columns from existing views

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker=on) AS
SELECT 
    user_id,
    display_name,
    avatar_url,
    current_streak,
    best_streak,
    show_on_leaderboard
FROM user_profiles
WHERE show_on_leaderboard = true;

COMMENT ON VIEW public.public_profiles IS 'Public leaderboard view - excludes personal information like bio, phone numbers, etc.';