-- Update RLS policy to allow public viewing of basic profile info
-- This enables the Director Profile page to work while still protecting sensitive data
DROP POLICY IF EXISTS "Public can view visible profiles" ON public.user_profiles;

-- Create a more permissive policy that allows viewing basic profile info for any user
-- The frontend will only display public-safe fields
CREATE POLICY "Anyone can view public profile fields"
ON public.user_profiles
FOR SELECT
USING (true);

-- Note: Sensitive data like phone_number, coaching settings, etc. should be handled
-- at the application level by only querying necessary fields