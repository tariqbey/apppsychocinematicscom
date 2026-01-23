-- Create daily_points table to store daily point totals
CREATE TABLE public.daily_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Breakdown of points earned
  ritual_points INTEGER NOT NULL DEFAULT 0,
  task_points INTEGER NOT NULL DEFAULT 0,
  journal_points INTEGER NOT NULL DEFAULT 0,
  scorecard_points INTEGER NOT NULL DEFAULT 0,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  penalty_points INTEGER NOT NULL DEFAULT 0,
  
  -- Calculated total
  total_points INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, points_date)
);

-- Enable RLS
ALTER TABLE public.daily_points ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own daily points"
ON public.daily_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily points"
ON public.daily_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily points"
ON public.daily_points FOR UPDATE
USING (auth.uid() = user_id);

-- Create point_transactions table for detailed tracking
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'ritual', 'task', 'journal', 'scorecard', 'bonus', 'penalty'
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own point transactions"
ON public.point_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own point transactions"
ON public.point_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_daily_points_user_date ON public.daily_points(user_id, points_date DESC);
CREATE INDEX idx_daily_points_date ON public.daily_points(points_date DESC);
CREATE INDEX idx_point_transactions_user_date ON public.point_transactions(user_id, transaction_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_daily_points_updated_at
BEFORE UPDATE ON public.daily_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get points leaderboard by time period
CREATE OR REPLACE FUNCTION public.get_points_leaderboard(
  time_period TEXT DEFAULT 'all_time'
)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  current_streak INTEGER,
  best_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  start_date DATE;
BEGIN
  -- Calculate start date based on time period
  CASE time_period
    WHEN 'weekly' THEN
      start_date := date_trunc('week', CURRENT_DATE)::DATE;
    WHEN 'monthly' THEN
      start_date := date_trunc('month', CURRENT_DATE)::DATE;
    WHEN 'yearly' THEN
      start_date := date_trunc('year', CURRENT_DATE)::DATE;
    ELSE
      start_date := '1970-01-01'::DATE; -- all_time
  END CASE;

  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(dp.total_points), 0) DESC) as rank,
    p.user_id,
    COALESCE(p.display_name, 'Anonymous Director') as display_name,
    p.avatar_url,
    COALESCE(SUM(dp.total_points), 0)::BIGINT as total_points,
    COALESCE(p.current_streak, 0) as current_streak,
    COALESCE(p.best_streak, 0) as best_streak
  FROM public.user_profiles p
  LEFT JOIN public.daily_points dp ON p.user_id = dp.user_id 
    AND dp.points_date >= start_date
  WHERE p.show_on_leaderboard = true
  GROUP BY p.user_id, p.display_name, p.avatar_url, p.current_streak, p.best_streak
  ORDER BY total_points DESC
  LIMIT 50;
END;
$$;

-- Function to get user's total points for a time period
CREATE OR REPLACE FUNCTION public.get_user_points_summary(
  p_user_id UUID,
  time_period TEXT DEFAULT 'all_time'
)
RETURNS TABLE(
  total_points BIGINT,
  ritual_points BIGINT,
  task_points BIGINT,
  journal_points BIGINT,
  scorecard_points BIGINT,
  bonus_points BIGINT,
  penalty_points BIGINT,
  days_active BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  start_date DATE;
BEGIN
  CASE time_period
    WHEN 'weekly' THEN
      start_date := date_trunc('week', CURRENT_DATE)::DATE;
    WHEN 'monthly' THEN
      start_date := date_trunc('month', CURRENT_DATE)::DATE;
    WHEN 'yearly' THEN
      start_date := date_trunc('year', CURRENT_DATE)::DATE;
    ELSE
      start_date := '1970-01-01'::DATE;
  END CASE;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(dp.total_points), 0)::BIGINT,
    COALESCE(SUM(dp.ritual_points), 0)::BIGINT,
    COALESCE(SUM(dp.task_points), 0)::BIGINT,
    COALESCE(SUM(dp.journal_points), 0)::BIGINT,
    COALESCE(SUM(dp.scorecard_points), 0)::BIGINT,
    COALESCE(SUM(dp.bonus_points), 0)::BIGINT,
    COALESCE(SUM(dp.penalty_points), 0)::BIGINT,
    COUNT(DISTINCT dp.points_date)::BIGINT
  FROM public.daily_points dp
  WHERE dp.user_id = p_user_id
    AND dp.points_date >= start_date;
END;
$$;