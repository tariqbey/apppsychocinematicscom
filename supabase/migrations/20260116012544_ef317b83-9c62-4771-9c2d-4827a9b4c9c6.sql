-- Create episodes table for mini-goals/sprints
CREATE TABLE public.episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  deadline DATE NOT NULL,
  duration_type TEXT NOT NULL DEFAULT 'week',
  status TEXT NOT NULL DEFAULT 'active',
  alignment_score INTEGER,
  alignment_reasoning TEXT,
  vision_answers JSONB,
  mind_movie_script_id UUID REFERENCES public.mind_movie_scripts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  CONSTRAINT valid_duration_type CHECK (duration_type IN ('week', 'two-weeks', '30-days', 'custom'))
);

-- Enable Row Level Security
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own episodes" 
ON public.episodes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own episodes" 
ON public.episodes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own episodes" 
ON public.episodes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own episodes" 
ON public.episodes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_episodes_updated_at
BEFORE UPDATE ON public.episodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_episodes_user_id ON public.episodes(user_id);
CREATE INDEX idx_episodes_status ON public.episodes(status);
CREATE INDEX idx_episodes_deadline ON public.episodes(deadline);