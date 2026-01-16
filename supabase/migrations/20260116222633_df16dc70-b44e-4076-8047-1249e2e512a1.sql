-- Create radio stations table for stream configurations
CREATE TABLE public.radio_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  stream_url TEXT,
  is_live BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create radio playlists table
CREATE TABLE public.radio_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create radio playlist tracks table
CREATE TABLE public.radio_playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.radio_playlists(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  duration_seconds INTEGER,
  track_order INTEGER DEFAULT 0,
  source_type TEXT DEFAULT 'admin_upload',
  source_media_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create radio featured tracks table (now playing / featured)
CREATE TABLE public.radio_featured_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  is_now_playing BOOLEAN DEFAULT false,
  featured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  featured_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_featured_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All users can view/listen
CREATE POLICY "Anyone can view radio stations"
ON public.radio_stations FOR SELECT
USING (true);

CREATE POLICY "Anyone can view radio playlists"
ON public.radio_playlists FOR SELECT
USING (true);

CREATE POLICY "Anyone can view playlist tracks"
ON public.radio_playlist_tracks FOR SELECT
USING (true);

CREATE POLICY "Anyone can view featured tracks"
ON public.radio_featured_tracks FOR SELECT
USING (true);

-- RLS Policies: Only admins can manage
CREATE POLICY "Admins can manage radio stations"
ON public.radio_stations FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage radio playlists"
ON public.radio_playlists FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage playlist tracks"
ON public.radio_playlist_tracks FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage featured tracks"
ON public.radio_featured_tracks FOR ALL
USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_playlist_tracks_playlist ON public.radio_playlist_tracks(playlist_id);
CREATE INDEX idx_featured_tracks_now_playing ON public.radio_featured_tracks(is_now_playing);
CREATE INDEX idx_playlists_featured ON public.radio_playlists(is_featured);

-- Enable realtime for now playing updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.radio_featured_tracks;