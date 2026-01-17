-- Create table to track Done For You Mind Movie orders
CREATE TABLE public.dfy_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  stripe_session_id TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_paid INTEGER NOT NULL DEFAULT 49700,
  subscription_starts_at TIMESTAMP WITH TIME ZONE,
  ghl_webhook_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dfy_orders ENABLE ROW LEVEL SECURITY;

-- Admin can view all orders
CREATE POLICY "Admins can view all DFY orders" 
ON public.dfy_orders 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Admin can update orders
CREATE POLICY "Admins can update DFY orders" 
ON public.dfy_orders 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- System can insert orders (for edge function)
CREATE POLICY "System can insert DFY orders" 
ON public.dfy_orders 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_dfy_orders_updated_at
BEFORE UPDATE ON public.dfy_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();