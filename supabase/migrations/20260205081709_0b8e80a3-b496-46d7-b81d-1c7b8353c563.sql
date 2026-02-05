-- Fix user_profiles public exposure by restoring owner-only access
-- The public_profiles view already exists for leaderboard/community features

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view public profile info" ON public.user_profiles;

-- Restore owner-only access to full profile data
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Fix dfy_orders by adding user access to their own orders
-- Currently only admins can view, but users should see their own orders too
CREATE POLICY "Users can view their own DFY orders"
ON public.dfy_orders
FOR SELECT
USING (auth.uid() = user_id);