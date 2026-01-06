-- Create credits table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  lifetime_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create awards table
CREATE TABLE public.user_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  award_type TEXT NOT NULL,
  award_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, award_type)
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_awards ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits
CREATE POLICY "Users can view their own credits" 
ON public.user_credits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits" 
ON public.user_credits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" 
ON public.user_credits FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for user_awards
CREATE POLICY "Users can view their own awards" 
ON public.user_awards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own awards" 
ON public.user_awards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on user_credits
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to award credits based on scorecard submission
CREATE OR REPLACE FUNCTION public.award_scorecard_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  credit_amount INTEGER;
BEGIN
  -- Award credits based on total score (0-12 scale)
  credit_amount := NEW.total_score * 10;
  
  -- Bonus for perfect score
  IF NEW.total_score = 12 THEN
    credit_amount := credit_amount + 50;
  END IF;
  
  -- Upsert credits
  INSERT INTO public.user_credits (user_id, credits, lifetime_credits)
  VALUES (NEW.user_id, credit_amount, credit_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits = user_credits.credits + credit_amount,
    lifetime_credits = user_credits.lifetime_credits + credit_amount,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to award credits on scorecard insert
CREATE TRIGGER award_credits_on_scorecard
AFTER INSERT ON public.daily_scorecards
FOR EACH ROW
EXECUTE FUNCTION public.award_scorecard_credits();