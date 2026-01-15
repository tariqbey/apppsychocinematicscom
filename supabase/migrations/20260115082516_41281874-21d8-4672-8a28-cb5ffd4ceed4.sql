-- Create access codes table for managing special access codes
CREATE TABLE public.access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  role_granted TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage access codes
CREATE POLICY "Admins can manage access codes"
ON public.access_codes
FOR ALL
USING (is_admin(auth.uid()));

-- Create table to track which users used which codes
CREATE TABLE public.access_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_code_id UUID NOT NULL REFERENCES public.access_codes(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, access_code_id)
);

-- Enable RLS
ALTER TABLE public.access_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.access_code_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to redeem an access code
CREATE OR REPLACE FUNCTION public.redeem_access_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_access_code RECORD;
  v_existing_redemption UUID;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find the access code
  SELECT * INTO v_access_code
  FROM public.access_codes
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF v_access_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired access code');
  END IF;
  
  -- Check if already redeemed by this user
  SELECT id INTO v_existing_redemption
  FROM public.access_code_redemptions
  WHERE user_id = v_user_id AND access_code_id = v_access_code.id;
  
  IF v_existing_redemption IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code already redeemed');
  END IF;
  
  -- Check if user already has the role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = v_access_code.role_granted::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have this access level');
  END IF;
  
  -- Grant the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_access_code.role_granted::app_role);
  
  -- Record the redemption
  INSERT INTO public.access_code_redemptions (user_id, access_code_id)
  VALUES (v_user_id, v_access_code.id);
  
  -- Increment the use count
  UPDATE public.access_codes
  SET current_uses = current_uses + 1
  WHERE id = v_access_code.id;
  
  RETURN jsonb_build_object('success', true, 'role', v_access_code.role_granted);
END;
$$;

-- Insert the initial access code
INSERT INTO public.access_codes (code, role_granted, is_active)
VALUES ('GetMoney2026', 'admin', true);