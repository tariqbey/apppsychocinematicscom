-- Add global reference photo to user_profiles for default use in image generations
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS reference_photo_url TEXT;

COMMENT ON COLUMN public.user_profiles.reference_photo_url IS 'Global reference photo URL for AI image generations featuring the user';

-- Create user playlists table for personal song collections
CREATE TABLE IF NOT EXISTS public.user_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  track_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user playlist tracks table
CREATE TABLE IF NOT EXISTS public.user_playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.user_playlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  source_type TEXT DEFAULT 'generated', -- 'generated', 'uploaded', 'challenge', 'episode'
  source_id TEXT, -- ID of the challenge, episode, or mind_movie_script
  metadata JSONB DEFAULT '{}',
  track_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge soundtracks table
CREATE TABLE IF NOT EXISTS public.challenge_soundtracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.adversity_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  lyrics TEXT,
  music_style TEXT,
  audio_url TEXT,
  suno_task_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
  character_traits JSONB, -- The traits the song reinforces
  archetype_id TEXT, -- Reference to the user's archetype
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create episode soundtracks table
CREATE TABLE IF NOT EXISTS public.episode_soundtracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  lyrics TEXT,
  music_style TEXT,
  audio_url TEXT,
  suno_task_id TEXT,
  status TEXT DEFAULT 'pending',
  character_traits JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_soundtracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_soundtracks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_playlists
CREATE POLICY "Users can view their own playlists"
ON public.user_playlists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists"
ON public.user_playlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
ON public.user_playlists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
ON public.user_playlists FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for user_playlist_tracks
CREATE POLICY "Users can view their own playlist tracks"
ON public.user_playlist_tracks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlist tracks"
ON public.user_playlist_tracks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlist tracks"
ON public.user_playlist_tracks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlist tracks"
ON public.user_playlist_tracks FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for challenge_soundtracks
CREATE POLICY "Users can view their own challenge soundtracks"
ON public.challenge_soundtracks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenge soundtracks"
ON public.challenge_soundtracks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge soundtracks"
ON public.challenge_soundtracks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenge soundtracks"
ON public.challenge_soundtracks FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for episode_soundtracks
CREATE POLICY "Users can view their own episode soundtracks"
ON public.episode_soundtracks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own episode soundtracks"
ON public.episode_soundtracks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own episode soundtracks"
ON public.episode_soundtracks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own episode soundtracks"
ON public.episode_soundtracks FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_playlists_user_id ON public.user_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlist_tracks_playlist_id ON public.user_playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_user_playlist_tracks_user_id ON public.user_playlist_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_soundtracks_challenge_id ON public.challenge_soundtracks(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_soundtracks_user_id ON public.challenge_soundtracks(user_id);
CREATE INDEX IF NOT EXISTS idx_episode_soundtracks_episode_id ON public.episode_soundtracks(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_soundtracks_user_id ON public.episode_soundtracks(user_id);

-- Trigger to update playlist track count and duration
CREATE OR REPLACE FUNCTION public.update_playlist_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE public.user_playlists 
    SET 
      track_count = (SELECT COUNT(*) FROM public.user_playlist_tracks WHERE playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id)),
      total_duration_seconds = (SELECT COALESCE(SUM(duration_seconds), 0) FROM public.user_playlist_tracks WHERE playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id)),
      updated_at = now()
    WHERE id = COALESCE(NEW.playlist_id, OLD.playlist_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_playlist_stats_trigger
AFTER INSERT OR DELETE ON public.user_playlist_tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_playlist_stats();