
-- Vouchers table for SaaS Owner to generate subscription vouchers
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan_cycle TEXT NOT NULL CHECK (plan_cycle IN ('monthly', 'semestral', 'annual')),
  plan_months INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  redeemed_by UUID REFERENCES public.stores(id),
  redeemed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Owners can manage all vouchers
CREATE POLICY "Owners can manage vouchers"
  ON public.vouchers FOR ALL
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- Store admins can view active vouchers (to redeem)
CREATE POLICY "Authenticated users can view active vouchers by code"
  ON public.vouchers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for vouchers
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;
