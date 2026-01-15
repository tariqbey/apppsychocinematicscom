-- Fix: Restrict post_likes SELECT access to authenticated users only
-- This prevents public tracking of user activity

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;

-- Create a new policy that only allows authenticated users to view likes
CREATE POLICY "Authenticated users can view likes" 
ON public.post_likes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);