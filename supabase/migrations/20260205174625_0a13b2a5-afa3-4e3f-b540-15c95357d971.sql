-- Add gradient color columns to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS gradient_start VARCHAR(7) DEFAULT '#FF8A00',
ADD COLUMN IF NOT EXISTS gradient_end VARCHAR(7) DEFAULT '#FF6A3D';