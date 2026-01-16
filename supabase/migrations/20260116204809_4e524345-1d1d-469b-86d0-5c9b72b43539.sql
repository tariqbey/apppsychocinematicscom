-- Create a table to store saved journal insights
CREATE TABLE public.saved_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved insights" 
ON public.saved_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved insights" 
ON public.saved_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved insights" 
ON public.saved_insights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_saved_insights_user_id ON public.saved_insights(user_id);
CREATE INDEX idx_saved_insights_type ON public.saved_insights(insight_type);