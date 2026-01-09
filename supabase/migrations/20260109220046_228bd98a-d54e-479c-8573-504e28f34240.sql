-- Fix 1: Add INSERT policy for production_credits table
CREATE POLICY "Users can insert their own credits"
ON public.production_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Add content length constraints to prevent storage exhaustion
ALTER TABLE public.director_posts
ADD CONSTRAINT director_posts_content_length_check
CHECK (length(content) <= 10000);

ALTER TABLE public.post_comments
ADD CONSTRAINT post_comments_content_length_check
CHECK (length(content) <= 2000);

ALTER TABLE public.daily_tasks
ADD CONSTRAINT daily_tasks_text_length_check
CHECK (length(task_text) <= 500);

-- Fix 3: Enforce user folder isolation for generated-images storage bucket
DROP POLICY IF EXISTS "Users can upload generated images" ON storage.objects;

CREATE POLICY "Users can upload their own generated images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);