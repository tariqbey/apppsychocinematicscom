-- Add chat summary column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS chat_summary text,
ADD COLUMN IF NOT EXISTS chat_summary_updated_at timestamp with time zone;