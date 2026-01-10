-- Create user_integrations table to store API keys and external service credentials
CREATE TABLE public.user_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  api_key TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_name)
);

-- Enable Row Level Security
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own integrations
CREATE POLICY "Users can view their own integrations"
ON public.user_integrations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own integrations
CREATE POLICY "Users can create their own integrations"
ON public.user_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
ON public.user_integrations
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
ON public.user_integrations
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_integrations_updated_at
BEFORE UPDATE ON public.user_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();