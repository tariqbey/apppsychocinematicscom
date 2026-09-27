-- Law of Success Personal Analysis
-- Stores each run of Napoleon Hill's Personal Analysis Chart (15 laws graded 0-100),
-- the Six Basic Fears inventory and the Maat alignment check.
-- The first run is the "before" (baseline); later runs are compared against it.

CREATE TABLE IF NOT EXISTS public.law_of_success_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_baseline BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  self_grades JSONB NOT NULL DEFAULT '{}'::jsonb,
  law_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  fear_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  maat_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  general_average INTEGER NOT NULL DEFAULT 0,
  chief_aim_grade INTEGER NOT NULL DEFAULT 0,
  maat_alignment INTEGER NOT NULL DEFAULT 0,
  danger_points TEXT[] NOT NULL DEFAULT '{}',
  blind_spots TEXT[] NOT NULL DEFAULT '{}',
  dominant_fear TEXT,
  reflection TEXT
);

ALTER TABLE public.law_of_success_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own law of success analyses"
  ON public.law_of_success_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own law of success analyses"
  ON public.law_of_success_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own law of success analyses"
  ON public.law_of_success_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own law of success analyses"
  ON public.law_of_success_analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_law_of_success_analyses_user_created
  ON public.law_of_success_analyses(user_id, created_at DESC);

-- The first analysis a user saves is their baseline ("before" column on Hill's chart).
CREATE OR REPLACE FUNCTION public.set_law_of_success_baseline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.law_of_success_analyses WHERE user_id = NEW.user_id
  ) THEN
    NEW.is_baseline := true;
  ELSE
    NEW.is_baseline := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_law_of_success_baseline_trigger
  BEFORE INSERT ON public.law_of_success_analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_law_of_success_baseline();
