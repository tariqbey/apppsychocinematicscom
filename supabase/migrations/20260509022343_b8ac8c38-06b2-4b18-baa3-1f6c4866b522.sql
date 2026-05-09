
CREATE TABLE public.coaching_session_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coaching_session_notes_user_id ON public.coaching_session_notes(user_id, created_at DESC);

ALTER TABLE public.coaching_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own session notes" ON public.coaching_session_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own session notes" ON public.coaching_session_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own session notes" ON public.coaching_session_notes
  FOR DELETE USING (auth.uid() = user_id);
