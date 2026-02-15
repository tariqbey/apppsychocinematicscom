
-- Create blueprints table for The Blueprint feature
CREATE TABLE public.blueprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  chief_aim_snapshot JSONB,
  strategic_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  sops JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own blueprints" ON public.blueprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own blueprints" ON public.blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blueprints" ON public.blueprints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blueprints" ON public.blueprints FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_blueprints_updated_at
BEFORE UPDATE ON public.blueprints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
