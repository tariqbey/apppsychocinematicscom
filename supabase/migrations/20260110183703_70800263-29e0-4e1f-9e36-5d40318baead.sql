-- Drop the overly permissive policy that exposes all columns including phone_number
-- Public access should go through the public_profiles view which excludes sensitive fields
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.user_profiles;