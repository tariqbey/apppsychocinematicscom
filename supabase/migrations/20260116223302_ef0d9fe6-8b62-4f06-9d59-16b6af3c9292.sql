-- Create radio submissions table for user-submitted tracks
CREATE TABLE public.radio_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id UUID NOT NULL,
  track_title TEXT NOT NULL,
  artist_name TEXT,
  audio_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radio_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
ON public.radio_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Users can submit their own tracks
CREATE POLICY "Users can submit their own tracks"
ON public.radio_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.radio_submissions FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can update submission status
CREATE POLICY "Admins can update submissions"
ON public.radio_submissions FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.radio_submissions FOR DELETE
USING (public.is_admin(auth.uid()));

-- Add source_type column to radio_stations if not exists for podcast/stream support
ALTER TABLE public.radio_stations 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'stream';

-- Add duration_seconds column to radio_stations for podcasts
ALTER TABLE public.radio_stations 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Create index for faster lookups
CREATE INDEX idx_radio_submissions_user ON public.radio_submissions(user_id);
CREATE INDEX idx_radio_submissions_status ON public.radio_submissions(status);