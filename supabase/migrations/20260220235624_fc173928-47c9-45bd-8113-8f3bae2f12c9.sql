
-- Table to store feature flags per store
CREATE TABLE public.store_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  features jsonb NOT NULL DEFAULT '{"table_service": true, "waiter_app": true, "courier_app": true, "loyalty_points": true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_features_store_id_unique UNIQUE (store_id)
);

-- Enable RLS
ALTER TABLE public.store_features ENABLE ROW LEVEL SECURITY;

-- Owner can manage all store features
CREATE POLICY "Owners can manage store features"
ON public.store_features FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Admins can read their store's features
CREATE POLICY "Admins can read store features"
ON public.store_features FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Anyone can read features (needed for sidebar/gate checks)
CREATE POLICY "Anyone can read store features"
ON public.store_features FOR SELECT
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_features;

-- Insert default features for existing stores
INSERT INTO public.store_features (store_id, features)
SELECT id, '{"table_service": true, "waiter_app": true, "courier_app": true, "loyalty_points": true}'::jsonb
FROM public.stores
ON CONFLICT (store_id) DO NOTHING;
