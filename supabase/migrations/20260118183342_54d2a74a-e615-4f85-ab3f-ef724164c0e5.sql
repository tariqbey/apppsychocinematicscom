-- Knowledge Sources table (books, papers, internal memos)
CREATE TABLE public.knowledge_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'book', -- book, paper, internal_memo
  title TEXT NOT NULL,
  author TEXT,
  year TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge Entries table (actual knowledge text the AI can retrieve)
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- cinematography, nlp, behavior_engineering, psycho_cinematics_framework, shot_psychology
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- AI-ready compressed version
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- Knowledge sources: All authenticated users can read, only admins can modify
CREATE POLICY "Authenticated users can view knowledge sources"
  ON public.knowledge_sources FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage knowledge sources"
  ON public.knowledge_sources FOR ALL
  USING (public.is_admin(auth.uid()));

-- Knowledge entries: All authenticated users can read active entries, only admins can modify
CREATE POLICY "Authenticated users can view active knowledge entries"
  ON public.knowledge_entries FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage knowledge entries"
  ON public.knowledge_entries FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create indexes for efficient querying
CREATE INDEX idx_knowledge_entries_category ON public.knowledge_entries(category);
CREATE INDEX idx_knowledge_entries_tags ON public.knowledge_entries USING GIN(tags);
CREATE INDEX idx_knowledge_entries_active ON public.knowledge_entries(is_active);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_knowledge_updated_at();

CREATE TRIGGER update_knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_knowledge_updated_at();