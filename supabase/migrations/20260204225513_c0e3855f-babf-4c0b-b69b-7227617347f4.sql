-- ============================================================================
-- STORE SETTINGS: Operational configuration (hours, delivery, payments)
-- APP SETTINGS: Add brand colors for theming
-- ============================================================================

-- 1) Create store_settings table for operational configuration
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Store Info (operational)
  store_name text NOT NULL DEFAULT 'Minha Pizzaria',
  store_phone text,
  store_address text,
  store_lat numeric,
  store_lng numeric,
  
  -- Timezone
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  
  -- Opening Hours (JSON structure with weekly schedule)
  opening_hours jsonb NOT NULL DEFAULT '{
    "mon": [{"start": "18:00", "end": "23:00"}],
    "tue": [{"start": "18:00", "end": "23:00"}],
    "wed": [{"start": "18:00", "end": "23:00"}],
    "thu": [{"start": "18:00", "end": "23:00"}],
    "fri": [{"start": "18:00", "end": "00:30"}],
    "sat": [{"start": "18:00", "end": "00:30"}],
    "sun": [{"start": "18:00", "end": "23:00"}]
  }'::jsonb,
  
  -- Auto open/close logic
  auto_open_close_enabled boolean NOT NULL DEFAULT true,
  is_open_override boolean DEFAULT NULL, -- NULL = auto, true = forced open, false = forced closed
  closed_message text DEFAULT 'Estamos fechados no momento. Volte em breve!',
  
  -- Delivery & Pickup
  delivery_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  min_order_value numeric DEFAULT 0,
  
  -- Payment Methods
  payment_pix_enabled boolean NOT NULL DEFAULT true,
  payment_card_enabled boolean NOT NULL DEFAULT true,
  payment_cash_enabled boolean NOT NULL DEFAULT true,
  
  -- SLA Targets (in minutes)
  sla_accept_minutes int DEFAULT 5,
  sla_prepare_minutes int DEFAULT 30,
  sla_delivery_minutes int DEFAULT 45,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Add brand colors to app_settings for theming
ALTER TABLE public.app_settings 
  ADD COLUMN IF NOT EXISTS brand_primary text DEFAULT '#FF8A00',
  ADD COLUMN IF NOT EXISTS brand_secondary text DEFAULT '#FF2D55',
  ADD COLUMN IF NOT EXISTS brand_accent text DEFAULT '#FFBB33',
  ADD COLUMN IF NOT EXISTS brand_background text DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS brand_surface text DEFAULT '#F9FAFB',
  ADD COLUMN IF NOT EXISTS brand_text text DEFAULT '#111827';

-- 3) Add mode and geometry columns to delivery_zones for radius/polygon support
ALTER TABLE public.delivery_zones
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'radius' CHECK (mode IN ('radius', 'polygon')),
  ADD COLUMN IF NOT EXISTS center_lat numeric,
  ADD COLUMN IF NOT EXISTS center_lng numeric,
  ADD COLUMN IF NOT EXISTS radius_km numeric,
  ADD COLUMN IF NOT EXISTS polygon_geojson jsonb,
  ADD COLUMN IF NOT EXISTS per_km_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_fee numeric,
  ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- 4) Enable RLS on store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies for store_settings
CREATE POLICY "Admins can manage store settings"
  ON public.store_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- 6) Auto-update updated_at trigger
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Insert default store_settings for the default store if not exists
INSERT INTO public.store_settings (store_id, store_name)
SELECT id, name FROM public.stores WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (store_id) DO NOTHING;