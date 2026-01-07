-- Add coaching call preferences to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS coaching_call_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coaching_call_time TEXT DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS coaching_call_timezone TEXT DEFAULT 'America/New_York';

-- Create coaching call logs table
CREATE TABLE public.coaching_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_status TEXT NOT NULL DEFAULT 'pending',
  call_sid TEXT,
  duration_seconds INTEGER,
  conversation_summary TEXT,
  tasks_reviewed JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coaching_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for coaching_call_logs
CREATE POLICY "Users can view their own call logs"
ON public.coaching_call_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call logs"
ON public.coaching_call_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_coaching_call_logs_user_date ON public.coaching_call_logs(user_id, call_date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_coaching_call_logs_updated_at
BEFORE UPDATE ON public.coaching_call_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();