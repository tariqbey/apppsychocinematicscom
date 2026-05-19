-- Enable pgvector for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 1) Extend user_profiles with Hill-style Chief Aim fields
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS chief_aim_definite_quantity TEXT,
  ADD COLUMN IF NOT EXISTS chief_aim_self_confidence_formula TEXT,
  ADD COLUMN IF NOT EXISTS chief_aim_written_statement TEXT,
  ADD COLUMN IF NOT EXISTS chief_aim_laws_applied JSONB DEFAULT '[]'::jsonb;

-- 2) Extend journal_entries for laws/fear tagging
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS relevant_laws JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fear_signals JSONB DEFAULT '[]'::jsonb;

-- 3) Law of Success chunks (RAG)
CREATE TABLE IF NOT EXISTS public.law_of_success_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volume INTEGER,
  lesson INTEGER,
  lesson_name TEXT,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS law_of_success_chunks_embedding_idx
  ON public.law_of_success_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.law_of_success_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read law chunks"
  ON public.law_of_success_chunks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage law chunks"
  ON public.law_of_success_chunks FOR ALL
  USING (public.is_admin(auth.uid()));

-- Semantic search function
CREATE OR REPLACE FUNCTION public.match_law_of_success(
  query_embedding vector(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  volume INTEGER,
  lesson INTEGER,
  lesson_name TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id,
    c.volume,
    c.lesson,
    c.lesson_name,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.law_of_success_chunks c
  WHERE c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4) ClickUp connections (per user)
CREATE TABLE IF NOT EXISTS public.user_clickup_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  default_workspace_id TEXT,
  default_space_id TEXT,
  default_list_id TEXT,
  default_list_name TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_clickup_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own clickup connection"
  ON public.user_clickup_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own clickup connection"
  ON public.user_clickup_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own clickup connection"
  ON public.user_clickup_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own clickup connection"
  ON public.user_clickup_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_clickup_connections_updated_at
  BEFORE UPDATE ON public.user_clickup_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) AI suggested tasks awaiting confirmation
CREATE TABLE IF NOT EXISTS public.suggested_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT,
  suggested_for_date DATE DEFAULT CURRENT_DATE,
  estimated_minutes INTEGER,
  linked_law_id INTEGER,
  linked_law_name TEXT,
  source TEXT NOT NULL DEFAULT 'director-ai',
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_task_id UUID,
  pushed_to_clickup BOOLEAN DEFAULT false,
  clickup_task_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suggested_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own suggested tasks"
  ON public.suggested_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own suggested tasks"
  ON public.suggested_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own suggested tasks"
  ON public.suggested_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own suggested tasks"
  ON public.suggested_tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_suggested_tasks_updated_at
  BEFORE UPDATE ON public.suggested_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS suggested_tasks_user_status_idx
  ON public.suggested_tasks (user_id, status, created_at DESC);