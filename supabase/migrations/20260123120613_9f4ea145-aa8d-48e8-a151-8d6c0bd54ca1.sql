-- Add chief aim song URL to user profiles for storing the personalized Chief Aim anthem
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS chief_aim_song_url TEXT;

-- Add chief aim song listened tracking to daily_rituals
-- This allows the user to either "read" or "listen" to their Chief Aim as part of the script_review ritual
ALTER TABLE public.daily_rituals
ADD COLUMN IF NOT EXISTS chief_aim_listened BOOLEAN DEFAULT false;