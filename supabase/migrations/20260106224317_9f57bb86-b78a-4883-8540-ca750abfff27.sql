-- Add avatar and bio to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add media support to director_posts
ALTER TABLE public.director_posts
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT; -- 'image' or 'video'

-- Create policy to allow viewing public profile info (display_name, avatar, bio) for community
CREATE POLICY "Anyone can view public profile info"
ON public.user_profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Create storage bucket for community media
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community media
CREATE POLICY "Anyone can view community media"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload community media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own community media"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);