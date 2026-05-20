
-- Fix: PRIVILEGE_ESCALATION — remove user-facing UPDATE/INSERT on point/credit/award tables.
-- All mutations must flow through SECURITY DEFINER functions / edge functions using service role.

DROP POLICY IF EXISTS "Users can update their own daily points" ON public.daily_points;
DROP POLICY IF EXISTS "Users can insert their own daily points" ON public.daily_points;

DROP POLICY IF EXISTS "Users can insert their own point transactions" ON public.point_transactions;

DROP POLICY IF EXISTS "Users can update their own credits" ON public.production_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.production_credits;

DROP POLICY IF EXISTS "Users can update their own user_credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own user_credits" ON public.user_credits;

DROP POLICY IF EXISTS "Users can insert their own awards" ON public.user_awards;
DROP POLICY IF EXISTS "Users can create their own awards" ON public.user_awards;

-- Fix: EXPOSED_SENSITIVE_DATA — movie_votes were world-readable.
-- Restrict raw rows to the voter; aggregate counts should be served via a view or RPC.
DROP POLICY IF EXISTS "Users can view all votes" ON public.movie_votes;
CREATE POLICY "Users can view their own votes"
  ON public.movie_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix: EXPOSED_SENSITIVE_DATA — user_profiles previously world-readable including phone_number,
-- chief_aim_*, chat_summary, coaching times, reference photos.
-- Tighten: drop the public "true" policy. Authenticated users can read profiles
-- (needed for leaderboards / director corner) but anonymous internet users cannot.
DROP POLICY IF EXISTS "Anyone can view public profile fields" ON public.user_profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Fix: MISSING_RLS_PROTECTION — atlas-inputs storage bucket had zero policies.
-- Make bucket private and add owner-scoped (folder = user id) policies.
UPDATE storage.buckets SET public = false WHERE id = 'atlas-inputs';

CREATE POLICY "Users can view their own atlas-inputs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'atlas-inputs' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own atlas-inputs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'atlas-inputs' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own atlas-inputs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'atlas-inputs' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own atlas-inputs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'atlas-inputs' AND (auth.uid())::text = (storage.foldername(name))[1]);
