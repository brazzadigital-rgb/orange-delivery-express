-- Add scheduled delivery option to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS scheduled_delivery_enabled boolean DEFAULT false;