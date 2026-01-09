-- Add new columns for dollar-based usage tracking
ALTER TABLE public.production_credits 
ADD COLUMN IF NOT EXISTS monthly_allowance_limit numeric NOT NULL DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS monthly_allowance_used numeric NOT NULL DEFAULT 0;

-- Add api_cost_usd column to credit_transactions for tracking actual API costs
ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS api_cost_usd numeric;

-- Create index for faster usage queries
CREATE INDEX IF NOT EXISTS idx_production_credits_user_id ON public.production_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON public.credit_transactions(user_id, created_at DESC);