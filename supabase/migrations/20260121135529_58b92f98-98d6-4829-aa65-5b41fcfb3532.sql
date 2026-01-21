-- Add reminder time columns to user_profiles for scheduled notifications
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS journal_reminder_time TIME,
ADD COLUMN IF NOT EXISTS morning_ritual_reminder_time TIME,
ADD COLUMN IF NOT EXISTS evening_scorecard_reminder_time TIME;