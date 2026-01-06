-- Add leaderboard opt-in to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN show_on_leaderboard BOOLEAN NOT NULL DEFAULT false;

-- Create a secure function to get leaderboard data (only shows opted-in users)
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  credits INTEGER,
  lifetime_credits INTEGER,
  current_streak INTEGER,
  best_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(c.lifetime_credits, 0) DESC) as rank,
    COALESCE(p.display_name, 'Anonymous Director') as display_name,
    COALESCE(c.credits, 0) as credits,
    COALESCE(c.lifetime_credits, 0) as lifetime_credits,
    COALESCE(p.current_streak, 0) as current_streak,
    COALESCE(p.best_streak, 0) as best_streak
  FROM public.user_profiles p
  LEFT JOIN public.user_credits c ON p.user_id = c.user_id
  WHERE p.show_on_leaderboard = true
  ORDER BY COALESCE(c.lifetime_credits, 0) DESC
  LIMIT 50;
END;
$$;