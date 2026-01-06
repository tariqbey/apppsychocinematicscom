-- Enable realtime for director posts and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.director_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;