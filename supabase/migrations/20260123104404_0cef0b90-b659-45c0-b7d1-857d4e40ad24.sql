-- Fix absurd "9999 days" output: always derive inactivity from real recent activity dates.
-- Streak (current/best) is still based on "good days" (all 5 rituals + >=3 completed tasks).
CREATE OR REPLACE FUNCTION public.calculate_activity_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  best_streak INTEGER,
  last_activity_date DATE,
  days_inactive INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_good_days DATE[];
  v_activity_days DATE[];
  v_last_activity DATE;

  v_last_good_day DATE;
  v_days_since_good INTEGER := 0;

  v_current_streak INTEGER := 0;
  v_best_streak INTEGER := 0;
  v_check_date DATE;
  v_found BOOLEAN;
BEGIN
  -- 1) Meaningful activity days (what should drive "days inactive")
  SELECT ARRAY_AGG(DISTINCT activity_date ORDER BY activity_date DESC)
  INTO v_activity_days
  FROM (
    SELECT view_date::DATE AS activity_date
    FROM viewing_history
    WHERE user_id = p_user_id

    UNION
    SELECT created_at::DATE AS activity_date
    FROM journal_entries
    WHERE user_id = p_user_id

    UNION
    SELECT scorecard_date::DATE AS activity_date
    FROM daily_scorecards
    WHERE user_id = p_user_id

    UNION
    SELECT task_date::DATE AS activity_date
    FROM daily_tasks
    WHERE user_id = p_user_id AND is_completed = true
  ) a;

  IF v_activity_days IS NULL OR array_length(v_activity_days, 1) IS NULL THEN
    -- No activity recorded yet
    RETURN QUERY SELECT 0, 0, NULL::DATE, 0;
    RETURN;
  END IF;

  v_last_activity := v_activity_days[1];

  -- 2) "Good days" that count towards streak
  SELECT ARRAY_AGG(DISTINCT good_date ORDER BY good_date DESC)
  INTO v_good_days
  FROM (
    SELECT r.ritual_date AS good_date
    FROM daily_rituals r
    WHERE r.user_id = p_user_id
      AND r.morning_screening = true
      AND r.script_review = true
      AND r.action_execution = true
      AND r.evening_review = true
      AND r.journal_entry = true
      AND EXISTS (
        SELECT 1
        FROM daily_tasks t
        WHERE t.user_id = p_user_id
          AND t.task_date = r.ritual_date
          AND t.is_completed = true
        GROUP BY t.task_date
        HAVING COUNT(*) >= 3
      )
  ) good;

  -- If no good days, streak stays 0, but inactivity is still real
  IF v_good_days IS NULL OR array_length(v_good_days, 1) IS NULL THEN
    RETURN QUERY
    SELECT 0,
           0,
           v_last_activity,
           (CURRENT_DATE - v_last_activity);
    RETURN;
  END IF;

  v_last_good_day := v_good_days[1];
  v_days_since_good := CURRENT_DATE - v_last_good_day;

  -- Current streak: consecutive good days, but only "active" if last good day is today
  v_check_date := v_last_good_day;
  v_current_streak := 0;
  LOOP
    v_found := v_check_date = ANY(v_good_days);
    EXIT WHEN NOT v_found;
    v_current_streak := v_current_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  IF v_days_since_good > 0 THEN
    v_current_streak := 0;
  END IF;

  -- Best streak: longest consecutive run of good days
  DECLARE
    v_sorted DATE[];
    v_temp INTEGER := 1;
    i INTEGER;
  BEGIN
    SELECT ARRAY_AGG(d ORDER BY d ASC) INTO v_sorted FROM UNNEST(v_good_days) d;
    v_best_streak := 1;

    FOR i IN 2..array_length(v_sorted, 1) LOOP
      IF v_sorted[i] = v_sorted[i-1] + 1 THEN
        v_temp := v_temp + 1;
      ELSE
        IF v_temp > v_best_streak THEN v_best_streak := v_temp; END IF;
        v_temp := 1;
      END IF;
    END LOOP;

    IF v_temp > v_best_streak THEN v_best_streak := v_temp; END IF;
  END;

  RETURN QUERY
  SELECT v_current_streak,
         v_best_streak,
         v_last_activity,
         (CURRENT_DATE - v_last_activity);
END;
$$;