-- Add journal_entry column to daily_rituals table
ALTER TABLE public.daily_rituals 
ADD COLUMN IF NOT EXISTS journal_entry boolean DEFAULT false;

-- Create a function to calculate the actual streak based on activity
CREATE OR REPLACE FUNCTION public.calculate_activity_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  best_streak INTEGER,
  last_activity_date DATE,
  days_inactive INTEGER
) AS $$
DECLARE
  v_activity_dates DATE[];
  v_current_streak INTEGER := 0;
  v_best_streak INTEGER := 0;
  v_last_activity DATE;
  v_days_inactive INTEGER := 0;
  v_check_date DATE;
  v_found BOOLEAN;
BEGIN
  -- Get all unique activity dates from multiple sources
  SELECT ARRAY_AGG(DISTINCT activity_date ORDER BY activity_date DESC)
  INTO v_activity_dates
  FROM (
    -- Viewing history
    SELECT view_date::DATE as activity_date FROM viewing_history WHERE user_id = p_user_id
    UNION
    -- Journal entries
    SELECT created_at::DATE as activity_date FROM journal_entries WHERE user_id = p_user_id
    UNION
    -- Daily scorecards
    SELECT scorecard_date::DATE as activity_date FROM daily_scorecards WHERE user_id = p_user_id
    UNION
    -- Daily rituals (if any ritual completed)
    SELECT ritual_date::DATE as activity_date FROM daily_rituals 
    WHERE user_id = p_user_id 
    AND (morning_screening = true OR script_review = true OR action_execution = true OR evening_review = true OR journal_entry = true)
    UNION
    -- Completed tasks
    SELECT task_date::DATE as activity_date FROM daily_tasks 
    WHERE user_id = p_user_id AND is_completed = true
  ) activities;
  
  -- If no activities, return zeros
  IF v_activity_dates IS NULL OR array_length(v_activity_dates, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0, NULL::DATE, 9999;
    RETURN;
  END IF;
  
  -- Get the most recent activity date
  v_last_activity := v_activity_dates[1];
  v_days_inactive := CURRENT_DATE - v_last_activity;
  
  -- Calculate current streak (consecutive days from most recent activity going back)
  v_check_date := v_last_activity;
  v_current_streak := 0;
  
  LOOP
    v_found := v_check_date = ANY(v_activity_dates);
    EXIT WHEN NOT v_found;
    v_current_streak := v_current_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;
  
  -- If there are inactive days, streak is broken (set to 0)
  IF v_days_inactive > 0 THEN
    v_current_streak := 0;
  END IF;
  
  -- Calculate best streak by finding longest consecutive run
  IF array_length(v_activity_dates, 1) > 0 THEN
    DECLARE
      v_sorted_dates DATE[];
      v_temp_streak INTEGER := 1;
      i INTEGER;
    BEGIN
      -- Sort dates ascending for streak calculation
      SELECT ARRAY_AGG(d ORDER BY d ASC) INTO v_sorted_dates
      FROM UNNEST(v_activity_dates) d;
      
      v_best_streak := 1;
      v_temp_streak := 1;
      
      FOR i IN 2..array_length(v_sorted_dates, 1) LOOP
        IF v_sorted_dates[i] = v_sorted_dates[i-1] + 1 THEN
          v_temp_streak := v_temp_streak + 1;
        ELSE
          IF v_temp_streak > v_best_streak THEN
            v_best_streak := v_temp_streak;
          END IF;
          v_temp_streak := 1;
        END IF;
      END LOOP;
      
      IF v_temp_streak > v_best_streak THEN
        v_best_streak := v_temp_streak;
      END IF;
    END;
  END IF;
  
  RETURN QUERY SELECT v_current_streak, v_best_streak, v_last_activity, v_days_inactive;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;