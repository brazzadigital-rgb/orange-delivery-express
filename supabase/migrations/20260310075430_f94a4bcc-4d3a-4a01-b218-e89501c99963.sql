-- Platform-level settings (single row, not tied to any store)
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL DEFAULT 'Delivery Litoral',
  platform_short_name TEXT NOT NULL DEFAULT 'Delivery',
  platform_description TEXT DEFAULT 'Plataforma de delivery para restaurantes e lojas',
  platform_favicon_url TEXT,
  platform_logo_url TEXT,
  platform_og_image_url TEXT,
  theme_color TEXT DEFAULT '#FF8A00',
  support_email TEXT,
  support_whatsapp TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read platform settings (needed for portal pages)
CREATE POLICY "Public read platform settings"
ON platform_settings FOR SELECT
USING (true);

-- Only global admins can manage
CREATE POLICY "Global admins manage platform settings"
ON platform_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default row
INSERT INTO platform_settings (platform_name, platform_short_name, platform_description)
VALUES ('Delivery Litoral', 'Delivery', 'Plataforma de delivery para restaurantes e lojas');