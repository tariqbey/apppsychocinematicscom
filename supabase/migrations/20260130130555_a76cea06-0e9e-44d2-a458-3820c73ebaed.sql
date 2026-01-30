-- Add album metadata columns to user_playlist_tracks
ALTER TABLE public.user_playlist_tracks
ADD COLUMN IF NOT EXISTS album_name TEXT,
ADD COLUMN IF NOT EXISTS album_cover_url TEXT;

-- Add album metadata columns to radio_playlist_tracks
ALTER TABLE public.radio_playlist_tracks
ADD COLUMN IF NOT EXISTS album_name TEXT,
ADD COLUMN IF NOT EXISTS album_cover_url TEXT;

-- Add album metadata columns to radio_featured_tracks
ALTER TABLE public.radio_featured_tracks
ADD COLUMN IF NOT EXISTS album_name TEXT,
ADD COLUMN IF NOT EXISTS album_cover_url TEXT;