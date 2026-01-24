-- Fix overly permissive RLS policy on dfy_orders table
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- so this permissive INSERT policy is unnecessary and dangerous

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert DFY orders" ON public.dfy_orders;

-- The service role key used by confirm-dfy-purchase edge function already 
-- bypasses RLS, so no INSERT policy is needed for system operations.
-- Admins can already SELECT and UPDATE via existing policies.