-- Create generated_media table to store generation history
CREATE TABLE public.generated_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  model_used TEXT NOT NULL,
  prompt TEXT NOT NULL,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  prediction_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generated_media ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own generated media" 
ON public.generated_media 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated media" 
ON public.generated_media 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated media" 
ON public.generated_media 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated media" 
ON public.generated_media 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_media_updated_at
BEFORE UPDATE ON public.generated_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();