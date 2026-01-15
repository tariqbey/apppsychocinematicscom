-- Create character_profiles table for storing archetype survey results
CREATE TABLE public.character_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  archetype TEXT NOT NULL,
  archetype_score JSONB NOT NULL DEFAULT '{}',
  survey_responses JSONB NOT NULL DEFAULT '{}',
  light_shadow_state TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.character_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own character profile"
ON public.character_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own character profile"
ON public.character_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own character profile"
ON public.character_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_character_profiles_updated_at
BEFORE UPDATE ON public.character_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();