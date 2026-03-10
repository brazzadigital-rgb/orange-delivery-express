
-- Payment provider settings per store
CREATE TABLE public.store_payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  efi_enabled boolean NOT NULL DEFAULT true,
  mp_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- Enable RLS
ALTER TABLE public.store_payment_settings ENABLE ROW LEVEL SECURITY;

-- Owner/admin can manage
CREATE POLICY "Admins can manage payment settings"
ON public.store_payment_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read (needed by subscription flow)
CREATE POLICY "Anyone can read payment settings"
ON public.store_payment_settings
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_store_payment_settings_updated_at
BEFORE UPDATE ON public.store_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
