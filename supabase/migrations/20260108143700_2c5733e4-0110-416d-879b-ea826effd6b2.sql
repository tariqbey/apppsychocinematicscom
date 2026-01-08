-- Create mind_movie_scripts table for storing storyboards
CREATE TABLE public.mind_movie_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  chief_aim_snapshot JSONB,
  visual_style TEXT,
  scenes JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mind_movie_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scripts"
ON public.mind_movie_scripts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts"
ON public.mind_movie_scripts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
ON public.mind_movie_scripts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
ON public.mind_movie_scripts
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_mind_movie_scripts_updated_at
BEFORE UPDATE ON public.mind_movie_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();