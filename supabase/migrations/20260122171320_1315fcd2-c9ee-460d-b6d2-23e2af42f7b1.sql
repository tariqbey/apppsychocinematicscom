-- Create saved_character_analyses table for storing AI character analysis history
CREATE TABLE public.saved_character_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis JSONB NOT NULL,
  metrics JSONB NOT NULL,
  napoleon_hill_laws JSONB,
  chief_aim_snapshot JSONB
);

-- Enable Row Level Security
ALTER TABLE public.saved_character_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own analyses" 
ON public.saved_character_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses" 
ON public.saved_character_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" 
ON public.saved_character_analyses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for efficient querying
CREATE INDEX idx_saved_character_analyses_user_id ON public.saved_character_analyses(user_id);
CREATE INDEX idx_saved_character_analyses_created_at ON public.saved_character_analyses(created_at DESC);