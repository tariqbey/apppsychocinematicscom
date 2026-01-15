-- Add cycle tracking fields to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS transformation_start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS current_cycle INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_cycle_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS cycles_completed INTEGER DEFAULT 0;

-- Create table for cycle reviews (end of each 21-day cycle)
CREATE TABLE public.cycle_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cycle_number INTEGER NOT NULL,
  act_number INTEGER NOT NULL,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Scorecard averages for the cycle
  avg_identity_alignment NUMERIC(3,2),
  avg_behavior_execution NUMERIC(3,2),
  avg_emotional_regulation NUMERIC(3,2),
  avg_forward_progress NUMERIC(3,2),
  avg_total_score NUMERIC(4,2),
  
  -- Character scorecard trait averages
  character_trait_averages JSONB,
  
  -- Archetype comparison (before/after)
  archetype_at_start TEXT,
  archetype_at_end TEXT,
  archetype_shifted BOOLEAN DEFAULT false,
  
  -- AI analysis
  ai_progress_report TEXT,
  
  -- User reflection
  biggest_win TEXT,
  biggest_challenge TEXT,
  commitment_for_next_cycle TEXT,
  
  -- Metadata
  days_completed INTEGER DEFAULT 21,
  streak_during_cycle INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cycle_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cycle reviews"
ON public.cycle_reviews
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cycle reviews"
ON public.cycle_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycle reviews"
ON public.cycle_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_cycle_reviews_user_cycle ON public.cycle_reviews(user_id, cycle_number);
CREATE INDEX idx_cycle_reviews_user_act ON public.cycle_reviews(user_id, act_number);

-- Create trigger for updated_at
CREATE TRIGGER update_cycle_reviews_updated_at
BEFORE UPDATE ON public.cycle_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();