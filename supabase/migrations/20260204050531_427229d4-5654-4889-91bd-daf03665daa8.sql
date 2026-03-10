-- =============================================
-- APP SETTINGS TABLE
-- =============================================
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  app_name TEXT NOT NULL DEFAULT 'Pizza Express',
  app_short_name TEXT NOT NULL DEFAULT 'Pizza',
  app_description TEXT DEFAULT 'O melhor delivery de pizza da cidade',
  theme_color TEXT DEFAULT '#FF8A00',
  background_color TEXT DEFAULT '#FFFFFF',
  app_logo_url TEXT,
  app_icon_192_url TEXT,
  app_icon_512_url TEXT,
  app_icon_maskable_url TEXT,
  splash_image_url TEXT,
  support_whatsapp TEXT,
  support_email TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  enable_install_banner BOOLEAN DEFAULT true,
  enable_push_notifications BOOLEAN DEFAULT false,
  enable_maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'Estamos em manutenção. Voltamos em breve!',
  enable_offline_catalog BOOLEAN DEFAULT true,
  offline_message TEXT DEFAULT 'Você está offline. Conecte-se para fazer pedidos.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PUSH SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE BUCKETS FOR APP ASSETS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('app-logos', 'app-logos', true),
  ('app-icons', 'app-icons', true),
  ('app-splash', 'app-splash', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for app-logos
CREATE POLICY "Anyone can view app logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-logos');

CREATE POLICY "Admins can upload app logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'app-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'app-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'app-logos' AND has_role(auth.uid(), 'admin'));

-- Storage policies for app-icons
CREATE POLICY "Anyone can view app icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-icons');

CREATE POLICY "Admins can upload app icons"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'app-icons' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app icons"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'app-icons' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app icons"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'app-icons' AND has_role(auth.uid(), 'admin'));

-- Storage policies for app-splash
CREATE POLICY "Anyone can view app splash"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-splash');

CREATE POLICY "Admins can upload app splash"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'app-splash' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app splash"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'app-splash' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app splash"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'app-splash' AND has_role(auth.uid(), 'admin'));

-- =============================================
-- INSERT DEFAULT SETTINGS
-- =============================================
INSERT INTO public.app_settings (store_id, app_name, app_short_name)
SELECT id, 'Pizza Express', 'Pizza'
FROM public.stores
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_settings WHERE store_id = stores.id
);