-- Create adversity_challenges table for tracking character challenges
CREATE TABLE public.adversity_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_trait TEXT NOT NULL,
  scenario_type TEXT NOT NULL,
  situation_description TEXT NOT NULL,
  emotional_trigger TEXT NOT NULL,
  
  -- Response tracking
  feeling TEXT,
  part_challenged TEXT,
  did_cut BOOLEAN,
  cut_notes TEXT,
  insight_gained TEXT,
  action_taken TEXT,
  response_type TEXT CHECK (response_type IN ('reactive', 'passive', 'transformative')),
  at_peace BOOLEAN,
  
  -- Scoring
  trait_xp_earned INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_character_checkins table
CREATE TABLE public.daily_character_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Midpoint conflict tracking
  hit_midpoint_conflict BOOLEAN,
  midpoint_description TEXT,
  
  -- Response tracking
  old_pattern_triggered BOOLEAN,
  old_pattern_description TEXT,
  chose_transformation BOOLEAN,
  transformation_action TEXT,
  
  -- Emotional state
  emotional_awareness TEXT,
  did_cut BOOLEAN,
  clarity_received TEXT,
  
  -- Overall reflection
  character_rating INTEGER CHECK (character_rating >= 0 AND character_rating <= 10),
  reflection_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.adversity_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_character_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies for adversity_challenges
CREATE POLICY "Users can view their own challenges" 
ON public.adversity_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenges" 
ON public.adversity_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" 
ON public.adversity_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges" 
ON public.adversity_challenges 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for daily_character_checkins
CREATE POLICY "Users can view their own checkins" 
ON public.daily_character_checkins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkins" 
ON public.daily_character_checkins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins" 
ON public.daily_character_checkins 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkins" 
ON public.daily_character_checkins 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_adversity_challenges_updated_at
BEFORE UPDATE ON public.adversity_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_character_checkins_updated_at
BEFORE UPDATE ON public.daily_character_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();