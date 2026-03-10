
-- Table to store purchase orders from /planos page
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_slug TEXT,
  amount NUMERIC NOT NULL,
  efi_txid TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Owner can read all purchase orders
CREATE POLICY "Owner can view all purchase orders"
ON public.purchase_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'owner'
  )
);

-- Anyone can insert (public page, no auth required)
CREATE POLICY "Anyone can create purchase orders"
ON public.purchase_orders
FOR INSERT
WITH CHECK (true);

-- Owner can update purchase orders
CREATE POLICY "Owner can update purchase orders"
ON public.purchase_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'owner'
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
