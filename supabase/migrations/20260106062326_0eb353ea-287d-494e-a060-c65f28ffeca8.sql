-- Create storage bucket for mind movie videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('mind-movies', 'mind-movies', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']);

-- Create table for user profiles with video and streak tracking
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  director_character_name TEXT,
  chief_aim_what TEXT,
  chief_aim_by_when TEXT,
  chief_aim_exchange TEXT,
  chief_aim_plan TEXT,
  current_act TEXT DEFAULT 'Act I: The Director Emerges',
  mind_movie_url TEXT,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_viewing_date DATE,
  day_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for daily scorecards
CREATE TABLE public.daily_scorecards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  identity_alignment INTEGER NOT NULL CHECK (identity_alignment >= 0 AND identity_alignment <= 3),
  behavior_execution INTEGER NOT NULL CHECK (behavior_execution >= 0 AND behavior_execution <= 3),
  emotional_regulation INTEGER NOT NULL CHECK (emotional_regulation >= 0 AND emotional_regulation <= 3),
  forward_progress INTEGER NOT NULL CHECK (forward_progress >= 0 AND forward_progress <= 3),
  total_score INTEGER GENERATED ALWAYS AS (identity_alignment + behavior_execution + emotional_regulation + forward_progress) STORED,
  scorecard_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, scorecard_date)
);

-- Create table for viewing history
CREATE TABLE public.viewing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INTEGER,
  UNIQUE(user_id, view_date)
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for daily_scorecards
CREATE POLICY "Users can view their own scorecards" ON public.daily_scorecards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scorecards" ON public.daily_scorecards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for viewing_history
CREATE POLICY "Users can view their own viewing history" ON public.viewing_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own viewing history" ON public.viewing_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage policies for mind-movies bucket
CREATE POLICY "Users can upload their own videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mind-movies' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own videos" ON storage.objects FOR SELECT USING (bucket_id = 'mind-movies' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own videos" ON storage.objects FOR UPDATE USING (bucket_id = 'mind-movies' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own videos" ON storage.objects FOR DELETE USING (bucket_id = 'mind-movies' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view public videos" ON storage.objects FOR SELECT USING (bucket_id = 'mind-movies');

-- Function to update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update streak on viewing
CREATE OR REPLACE FUNCTION public.update_viewing_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_view DATE;
  current_streak_val INTEGER;
  best_streak_val INTEGER;
BEGIN
  -- Get current profile data
  SELECT last_viewing_date, current_streak, best_streak 
  INTO last_view, current_streak_val, best_streak_val
  FROM public.user_profiles 
  WHERE user_id = NEW.user_id;
  
  IF last_view IS NULL THEN
    -- First ever viewing
    current_streak_val := 1;
  ELSIF last_view = NEW.view_date - INTERVAL '1 day' THEN
    -- Consecutive day
    current_streak_val := current_streak_val + 1;
  ELSIF last_view = NEW.view_date THEN
    -- Same day, no change
    NULL;
  ELSE
    -- Streak broken
    current_streak_val := 1;
  END IF;
  
  -- Update best streak if needed
  IF current_streak_val > best_streak_val THEN
    best_streak_val := current_streak_val;
  END IF;
  
  -- Update profile
  UPDATE public.user_profiles
  SET current_streak = current_streak_val,
      best_streak = best_streak_val,
      last_viewing_date = NEW.view_date,
      day_number = day_number + 1
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public SECURITY DEFINER;

-- Trigger for streak updates
CREATE TRIGGER on_viewing_history_insert
  AFTER INSERT ON public.viewing_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_viewing_streak();