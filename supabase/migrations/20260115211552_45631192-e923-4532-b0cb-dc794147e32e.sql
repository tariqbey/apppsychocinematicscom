-- Create table for daily character scorecard entries
CREATE TABLE public.character_scorecards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scorecard_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Store which traits the user is tracking (from their transformation analysis)
  required_character_name TEXT,
  traits JSONB DEFAULT '[]'::jsonb,
  -- Scores for each trait (0-3 scale like daily scorecard)
  trait_scores JSONB DEFAULT '{}'::jsonb,
  -- Overall alignment score (calculated)
  total_score INTEGER,
  max_possible_score INTEGER,
  -- Notes/reflection
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate entries per day
  CONSTRAINT unique_character_scorecard_per_day UNIQUE (user_id, scorecard_date)
);

-- Enable Row Level Security
ALTER TABLE public.character_scorecards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own character scorecards" 
ON public.character_scorecards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own character scorecards" 
ON public.character_scorecards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own character scorecards" 
ON public.character_scorecards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_character_scorecards_user_date ON public.character_scorecards(user_id, scorecard_date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_character_scorecards_updated_at
BEFORE UPDATE ON public.character_scorecards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add column to character_profiles to store the last transformation analysis
ALTER TABLE public.character_profiles 
ADD COLUMN IF NOT EXISTS transformation_analysis JSONB DEFAULT NULL;