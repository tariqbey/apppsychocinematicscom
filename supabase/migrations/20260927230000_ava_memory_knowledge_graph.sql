-- Ava's long-term memory and the user's personal knowledge graph.
--
-- ava_memories: durable things Ava should remember about the user (facts, goals,
--   wins, struggles, commitments, people, preferences, session summaries).
-- kg_nodes / kg_edges: the user's knowledge graph — the people, goals, projects,
--   habits, fears, strengths, values, readings and ideas in their life, and how
--   they connect. Ava builds it from conversations; the user can view it in the app.

CREATE TABLE IF NOT EXISTS public.ava_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'fact',
  content TEXT NOT NULL,
  importance SMALLINT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  source TEXT NOT NULL DEFAULT 'ava',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ava_memories_user_created ON public.ava_memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ava_memories_user_importance ON public.ava_memories(user_id, importance DESC);

ALTER TABLE public.ava_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own Ava memories" ON public.ava_memories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.kg_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'idea',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kg_nodes_user_label ON public.kg_nodes(user_id, lower(label));

ALTER TABLE public.kg_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own graph nodes" ON public.kg_nodes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.kg_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_id UUID NOT NULL REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kg_edges ON public.kg_edges(user_id, source_id, target_id, lower(relation));

ALTER TABLE public.kg_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own graph edges" ON public.kg_edges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ava_memories, public.kg_nodes, public.kg_edges TO authenticated;
