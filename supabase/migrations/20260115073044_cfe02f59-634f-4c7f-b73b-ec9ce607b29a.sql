-- Featured content and voting system for community

-- Create table for featured content (Movie of the Week, Director of the Month, etc.)
CREATE TABLE public.featured_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('movie_of_week', 'director_of_month', 'movie_of_month', 'movie_of_year')),
  user_id UUID NOT NULL,
  movie_id UUID REFERENCES public.mind_movie_scripts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  movie_url TEXT,
  thumbnail_url TEXT,
  feature_period_start DATE NOT NULL,
  feature_period_end DATE NOT NULL,
  total_votes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for community votes on Mind Movies
CREATE TABLE public.movie_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES public.mind_movie_scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'nomination')),
  vote_period TEXT NOT NULL, -- e.g., '2026-W03' for weekly, '2026-01' for monthly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (movie_id, user_id, vote_period)
);

-- Create table for annual awards (Oscar-style)
CREATE TABLE public.annual_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  award_year INTEGER NOT NULL,
  award_category TEXT NOT NULL CHECK (award_category IN (
    'best_mind_movie',
    'most_transformative_director',
    'highest_scorer',
    'longest_streak',
    'most_improved',
    'community_favorite',
    'rising_star'
  )),
  movie_id UUID REFERENCES public.mind_movie_scripts(id) ON DELETE SET NULL,
  total_votes INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  metadata JSONB,
  awarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for community movie submissions (for voting)
CREATE TABLE public.community_movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id UUID NOT NULL REFERENCES public.mind_movie_scripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  movie_url TEXT NOT NULL,
  thumbnail_url TEXT,
  chief_aim_preview TEXT,
  votes_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (movie_id)
);

-- Enable RLS
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_movies ENABLE ROW LEVEL SECURITY;

-- Featured content policies (readable by all, managed by admins)
CREATE POLICY "Featured content is viewable by everyone" 
ON public.featured_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage featured content" 
ON public.featured_content FOR ALL 
USING (public.is_admin(auth.uid()));

-- Movie votes policies
CREATE POLICY "Users can view all votes" 
ON public.movie_votes FOR SELECT USING (true);

CREATE POLICY "Users can vote on movies" 
ON public.movie_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes" 
ON public.movie_votes FOR DELETE 
USING (auth.uid() = user_id);

-- Annual awards policies (viewable by all)
CREATE POLICY "Awards are viewable by everyone" 
ON public.annual_awards FOR SELECT USING (true);

CREATE POLICY "Admins can manage annual awards" 
ON public.annual_awards FOR ALL 
USING (public.is_admin(auth.uid()));

-- Community movies policies
CREATE POLICY "Public movies are viewable by everyone" 
ON public.community_movies FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can submit their own movies" 
ON public.community_movies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
ON public.community_movies FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions" 
ON public.community_movies FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for community features
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_movies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movie_votes;

-- Create trigger for updated_at
CREATE TRIGGER update_featured_content_updated_at
BEFORE UPDATE ON public.featured_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_movies_updated_at
BEFORE UPDATE ON public.community_movies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();