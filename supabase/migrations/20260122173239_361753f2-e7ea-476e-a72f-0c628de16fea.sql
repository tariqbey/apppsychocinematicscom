-- Persist Storyboard Wizard draft fields in existing mind_movie_scripts records
ALTER TABLE public.mind_movie_scripts
  ADD COLUMN IF NOT EXISTS vision_answers jsonb;

ALTER TABLE public.mind_movie_scripts
  ADD COLUMN IF NOT EXISTS script_input text;

ALTER TABLE public.mind_movie_scripts
  ADD COLUMN IF NOT EXISTS elements jsonb;

ALTER TABLE public.mind_movie_scripts
  ADD COLUMN IF NOT EXISTS input_mode text;

ALTER TABLE public.mind_movie_scripts
  ADD COLUMN IF NOT EXISTS target_duration integer;

ALTER TABLE public.mind_movie_scripts
  ADD COLUMN IF NOT EXISTS aspect_ratio text;
