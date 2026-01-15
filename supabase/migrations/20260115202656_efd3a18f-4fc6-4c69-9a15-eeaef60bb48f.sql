-- Add incomplete_reason column to daily_tasks table
ALTER TABLE public.daily_tasks 
ADD COLUMN incomplete_reason TEXT DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.daily_tasks.incomplete_reason IS 'Reason why task was not completed: procrastinating, others_movie, or ran_out_of_time';