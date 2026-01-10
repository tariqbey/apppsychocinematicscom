-- Create table for persisting daily ritual completion state
CREATE TABLE public.daily_rituals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ritual_date DATE NOT NULL DEFAULT CURRENT_DATE,
  morning_screening BOOLEAN NOT NULL DEFAULT false,
  script_review BOOLEAN NOT NULL DEFAULT false,
  action_execution BOOLEAN NOT NULL DEFAULT false,
  evening_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT daily_rituals_user_date_unique UNIQUE (user_id, ritual_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_rituals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own rituals" 
ON public.daily_rituals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rituals" 
ON public.daily_rituals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rituals" 
ON public.daily_rituals 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_rituals_updated_at
BEFORE UPDATE ON public.daily_rituals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();