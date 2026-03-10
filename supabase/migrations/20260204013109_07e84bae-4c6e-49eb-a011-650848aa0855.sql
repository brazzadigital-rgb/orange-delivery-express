-- Create promotions table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'value', 'combo', 'free_delivery')),
  discount_value NUMERIC DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'inactive_30d', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promotions"
ON public.promotions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active promotions"
ON public.promotions FOR SELECT
USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

-- Enable realtime for promotions
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;