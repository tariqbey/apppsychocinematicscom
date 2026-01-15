-- Add UNIQUE constraint on stripe_session_id to prevent duplicate processing
CREATE UNIQUE INDEX IF NOT EXISTS unique_stripe_session 
ON public.credit_transactions(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

-- Create atomic function for credit allocation that handles race conditions
CREATE OR REPLACE FUNCTION public.allocate_credits_atomic(
  p_user_id UUID,
  p_session_id TEXT,
  p_credits NUMERIC,
  p_description TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Single atomic transaction with constraint enforcement
  -- The unique index will prevent duplicate inserts
  INSERT INTO credit_transactions (user_id, stripe_session_id, amount, transaction_type, description)
  VALUES (p_user_id, p_session_id, p_credits, 'purchase', p_description);
  
  -- Upsert production credits
  INSERT INTO production_credits (user_id, purchased_credits, monthly_allowance_limit)
  VALUES (p_user_id, p_credits, 1000)
  ON CONFLICT (user_id) DO UPDATE
  SET purchased_credits = production_credits.purchased_credits + p_credits,
      updated_at = now();
  
  RETURN jsonb_build_object('success', true, 'credits', p_credits);
EXCEPTION
  WHEN unique_violation THEN
    -- Already processed - return success without adding credits
    RETURN jsonb_build_object('success', true, 'alreadyProcessed', true);
END;
$$;