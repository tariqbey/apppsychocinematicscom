-- Add reminder settings and push notification columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS journal_reminder_time TIME,
ADD COLUMN IF NOT EXISTS morning_ritual_reminder_time TIME,
ADD COLUMN IF NOT EXISTS evening_scorecard_reminder_time TIME;

-- Add index for users with notifications enabled
CREATE INDEX IF NOT EXISTS idx_user_profiles_push_enabled ON public.user_profiles(push_notifications_enabled) WHERE push_notifications_enabled = true;