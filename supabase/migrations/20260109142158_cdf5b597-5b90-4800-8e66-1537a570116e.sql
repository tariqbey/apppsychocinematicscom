-- Add soundtrack columns to mind_movie_scripts table
ALTER TABLE public.mind_movie_scripts
ADD COLUMN IF NOT EXISTS soundtrack_url TEXT,
ADD COLUMN IF NOT EXISTS song_lyrics TEXT,
ADD COLUMN IF NOT EXISTS music_style TEXT,
ADD COLUMN IF NOT EXISTS suno_task_id TEXT;