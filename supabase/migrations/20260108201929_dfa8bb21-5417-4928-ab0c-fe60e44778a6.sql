-- Create app_role enum for role management
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create production_credits table for tracking generation credits
CREATE TABLE public.production_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    monthly_credits NUMERIC(10,2) NOT NULL DEFAULT 0,
    purchased_credits NUMERIC(10,2) NOT NULL DEFAULT 0,
    monthly_credits_reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on production_credits
ALTER TABLE public.production_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for production_credits
CREATE POLICY "Users can view their own credits"
ON public.production_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
ON public.production_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- Create credit_transactions table for audit trail
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('monthly_allocation', 'purchase', 'generation', 'refund')),
    description TEXT,
    media_type TEXT,
    generation_id UUID,
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at on production_credits
CREATE TRIGGER update_production_credits_updated_at
BEFORE UPDATE ON public.production_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert admin role for drpaydex@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('f39de720-9444-43a5-93f1-d1aba27d0482', 'admin');

-- Initialize production credits for admin with unlimited (9999)
INSERT INTO public.production_credits (user_id, monthly_credits, purchased_credits)
VALUES ('f39de720-9444-43a5-93f1-d1aba27d0482', 9999, 9999);