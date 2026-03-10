
-- store_role enum + store_users + stores columns + functions
CREATE TYPE public.store_role AS ENUM ('owner', 'admin', 'staff');

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE, ADD COLUMN IF NOT EXISTS owner_email TEXT, ADD COLUMN IF NOT EXISTS created_by UUID, ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free', ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active', ADD COLUMN IF NOT EXISTS custom_domain TEXT;

CREATE TABLE public.store_users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role store_role NOT NULL DEFAULT 'staff', accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(store_id, user_id));
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_store_users_user_id ON public.store_users(user_id);
CREATE INDEX idx_store_users_store_id ON public.store_users(store_id);
CREATE POLICY "Users can view own store memberships" ON public.store_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage store_users" ON public.store_users FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));
ALTER TABLE public.store_users ADD CONSTRAINT store_users_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.store_users ADD CONSTRAINT store_users_store_id_stores_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.has_store_role(p_user_id UUID, p_store_id UUID, p_roles store_role[]) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.store_users WHERE user_id = p_user_id AND store_id = p_store_id AND role = ANY(p_roles)) $$;

CREATE OR REPLACE FUNCTION public.has_store_access(p_user_id uuid, p_store_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT EXISTS (SELECT 1 FROM public.store_users WHERE user_id = p_user_id AND store_id = p_store_id) OR has_role(p_user_id, 'admin'::app_role) OR EXISTS (SELECT 1 FROM public.stores s JOIN auth.users u ON u.id = p_user_id WHERE s.id = p_store_id AND s.owner_email = u.email) $$;

-- promotions
CREATE TABLE public.promotions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, banner_url TEXT, discount_type TEXT NOT NULL, discount_value NUMERIC DEFAULT 0, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, active BOOLEAN DEFAULT true, target_audience TEXT DEFAULT 'all', created_at TIMESTAMPTZ DEFAULT now());
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;

-- storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true),('sounds','sounds',true),('promotions','promotions',true),('products','products',true),('app-logos','app-logos',true),('app-icons','app-icons',true),('app-splash','app-splash',true) ON CONFLICT (id) DO NOTHING;

-- driver_locations_latest view
CREATE VIEW public.driver_locations_latest WITH (security_invoker = on) AS SELECT DISTINCT ON (order_id) id, driver_id, order_id, lat, lng, accuracy, heading, speed, recorded_at FROM public.driver_locations ORDER BY order_id, recorded_at DESC;

-- carts, cart_items, payment_intents, audit_logs
CREATE TABLE public.carts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'active', coupon_code text, subtotal numeric NOT NULL DEFAULT 0, delivery_fee numeric NOT NULL DEFAULT 0, discount numeric NOT NULL DEFAULT 0, total numeric NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cart_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, name_snapshot text NOT NULL, quantity integer NOT NULL DEFAULT 1, base_price numeric NOT NULL, options_snapshot jsonb DEFAULT '[]'::jsonb, item_total numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.payment_intents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, provider text NOT NULL DEFAULT 'manual', method text NOT NULL, status text NOT NULL DEFAULT 'pending', amount numeric NOT NULL, currency text NOT NULL DEFAULT 'BRL', payload jsonb DEFAULT '{}'::jsonb, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, actor_role text, action text NOT NULL, entity_type text NOT NULL, entity_id uuid, metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own carts" ON public.carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own carts" ON public.carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own carts" ON public.carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own carts" ON public.carts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all carts" ON public.carts FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Users view own cart items" ON public.cart_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()));
CREATE POLICY "Users create cart items" ON public.cart_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()));
CREATE POLICY "Users update own cart items" ON public.cart_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()));
CREATE POLICY "Users delete own cart items" ON public.cart_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()));
CREATE POLICY "Admins view all cart items" ON public.cart_items FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Users view own payment intents" ON public.payment_intents FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payment_intents.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins manage all payment intents" ON public.payment_intents FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authed create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON public.payment_intents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- app_settings
CREATE TABLE public.app_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE, app_name TEXT NOT NULL DEFAULT 'Pizza Express', app_short_name TEXT NOT NULL DEFAULT 'Pizza', app_description TEXT DEFAULT 'O melhor delivery', theme_color TEXT DEFAULT '#FF8A00', background_color TEXT DEFAULT '#FFFFFF', app_logo_url TEXT, app_icon_192_url TEXT, app_icon_512_url TEXT, app_icon_maskable_url TEXT, splash_image_url TEXT, support_whatsapp TEXT, support_email TEXT, terms_url TEXT, privacy_url TEXT, enable_install_banner BOOLEAN DEFAULT true, enable_push_notifications BOOLEAN DEFAULT false, enable_maintenance_mode BOOLEAN DEFAULT false, maintenance_message TEXT DEFAULT 'Estamos em manutenção.', enable_offline_catalog BOOLEAN DEFAULT true, offline_message TEXT DEFAULT 'Você está offline.', brand_primary text DEFAULT '#FF8A00', brand_secondary text DEFAULT '#FF2D55', brand_accent text DEFAULT '#FFBB33', brand_background text DEFAULT '#FFFFFF', brand_surface text DEFAULT '#F9FAFB', brand_text text DEFAULT '#111827', gradient_start VARCHAR(7) DEFAULT '#FF8A00', gradient_end VARCHAR(7) DEFAULT '#FF6A3D', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- store_settings
CREATE TABLE public.store_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE, store_name text NOT NULL DEFAULT 'Minha Pizzaria', store_phone text, store_address text, store_lat numeric, store_lng numeric, timezone text NOT NULL DEFAULT 'America/Sao_Paulo', opening_hours jsonb NOT NULL DEFAULT '{"mon":[{"start":"18:00","end":"23:00"}],"tue":[{"start":"18:00","end":"23:00"}],"wed":[{"start":"18:00","end":"23:00"}],"thu":[{"start":"18:00","end":"23:00"}],"fri":[{"start":"18:00","end":"00:30"}],"sat":[{"start":"18:00","end":"00:30"}],"sun":[{"start":"18:00","end":"23:00"}]}'::jsonb, auto_open_close_enabled boolean NOT NULL DEFAULT true, is_open_override boolean DEFAULT NULL, closed_message text DEFAULT 'Estamos fechados.', delivery_enabled boolean NOT NULL DEFAULT true, pickup_enabled boolean NOT NULL DEFAULT true, min_order_value numeric DEFAULT 0, payment_pix_enabled boolean NOT NULL DEFAULT true, payment_card_enabled boolean NOT NULL DEFAULT true, payment_cash_enabled boolean NOT NULL DEFAULT true, sla_accept_minutes int DEFAULT 5, sla_prepare_minutes int DEFAULT 30, sla_delivery_minutes int DEFAULT 45, scheduled_delivery_enabled boolean DEFAULT false, token_expiration_minutes integer DEFAULT 60, require_table_pin boolean DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Store owners and admins can manage store settings" ON public.store_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role]));
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- push_subscriptions
CREATE TABLE public.push_subscriptions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, endpoint TEXT NOT NULL UNIQUE, keys JSONB NOT NULL, user_agent TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all push subs" ON public.push_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;

-- delivery_zones extra columns
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS mode text DEFAULT 'radius', ADD COLUMN IF NOT EXISTS center_lat numeric, ADD COLUMN IF NOT EXISTS center_lng numeric, ADD COLUMN IF NOT EXISTS radius_km numeric, ADD COLUMN IF NOT EXISTS polygon_geojson jsonb, ADD COLUMN IF NOT EXISTS per_km_fee numeric DEFAULT 0, ADD COLUMN IF NOT EXISTS max_fee numeric, ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- user_notification_preferences
CREATE TABLE public.user_notification_preferences (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE, order_sound_enabled BOOLEAN NOT NULL DEFAULT true, order_sound_volume NUMERIC NOT NULL DEFAULT 0.8, order_sound_type TEXT NOT NULL DEFAULT 'soft_chime', push_enabled BOOLEAN NOT NULL DEFAULT false, vibration_enabled BOOLEAN NOT NULL DEFAULT true, last_sound_unlocked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notif prefs" ON public.user_notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notif prefs" ON public.user_notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notif prefs" ON public.user_notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON public.user_notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- push_delivery_logs
CREATE TABLE public.push_delivery_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, endpoint_hash TEXT NOT NULL, status TEXT NOT NULL, http_status INTEGER, error_message TEXT, payload JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own push logs" ON public.push_delivery_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all push logs" ON public.push_delivery_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own push logs" ON public.push_delivery_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins insert push logs" ON public.push_delivery_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ifood tables
CREATE TABLE public.ifood_connections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, mode TEXT NOT NULL DEFAULT 'POLLING', client_id TEXT NOT NULL, client_secret TEXT NOT NULL, access_token TEXT, refresh_token TEXT, expires_at TIMESTAMPTZ, last_poll_at TIMESTAMPTZ, enabled BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT unique_store_ifood_connection UNIQUE (store_id));
CREATE TABLE public.ifood_merchants (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), connection_id UUID NOT NULL REFERENCES public.ifood_connections(id) ON DELETE CASCADE, merchant_id TEXT NOT NULL, name TEXT, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT unique_merchant_per_connection UNIQUE (connection_id, merchant_id));
CREATE TABLE public.ifood_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), connection_id UUID NOT NULL REFERENCES public.ifood_connections(id) ON DELETE CASCADE, event_id TEXT NOT NULL UNIQUE, code TEXT NOT NULL, full_code TEXT, order_id TEXT, merchant_id TEXT, created_at_event TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb, processed BOOLEAN NOT NULL DEFAULT false, processed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.order_status_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, source TEXT NOT NULL DEFAULT 'internal', from_status TEXT, to_status TEXT NOT NULL, payload JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

ALTER TABLE public.ifood_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage iFood connections" ON public.ifood_connections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage iFood merchants" ON public.ifood_merchants FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage iFood events" ON public.ifood_events FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Admins manage order status history" ON public.order_status_history FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Users view own order status history" ON public.order_status_history FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()));
CREATE TRIGGER update_ifood_connections_updated_at BEFORE UPDATE ON public.ifood_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.ifood_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;

-- pizza builder tables
CREATE TABLE public.pizza_sizes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, name TEXT NOT NULL, slices INTEGER NOT NULL, max_flavors INTEGER NOT NULL DEFAULT 1, base_price NUMERIC NOT NULL DEFAULT 0, is_promo BOOLEAN DEFAULT false, promo_label TEXT, sort_order INTEGER DEFAULT 0, active BOOLEAN DEFAULT true, unit_label text, description text, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.pizza_flavors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, image_url TEXT, active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, unit_price numeric DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.pizza_flavor_prices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, size_id UUID NOT NULL REFERENCES public.pizza_sizes(id) ON DELETE CASCADE, flavor_id UUID NOT NULL REFERENCES public.pizza_flavors(id) ON DELETE CASCADE, price NUMERIC NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (size_id, flavor_id));
CREATE TABLE public.pizza_addon_groups (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, name TEXT NOT NULL, max_select INTEGER DEFAULT 1, min_select INTEGER DEFAULT 0, group_type TEXT NOT NULL DEFAULT 'single', sort_order INTEGER DEFAULT 0, active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.pizza_addons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, group_id UUID NOT NULL REFERENCES public.pizza_addon_groups(id) ON DELETE CASCADE, name TEXT NOT NULL, price NUMERIC NOT NULL DEFAULT 0, active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.store_pizza_settings (store_id UUID NOT NULL PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE, pricing_rule TEXT NOT NULL DEFAULT 'average', require_at_least_one_flavor BOOLEAN DEFAULT true, allow_less_than_max BOOLEAN DEFAULT true, max_observation_chars INTEGER DEFAULT 140, pricing_mode text NOT NULL DEFAULT 'matrix', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());

ALTER TABLE public.pizza_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_flavor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pizza_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pizza sizes" ON public.pizza_sizes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view active pizza sizes" ON public.pizza_sizes FOR SELECT USING (active = true);
CREATE POLICY "Admins manage pizza flavors" ON public.pizza_flavors FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view active pizza flavors" ON public.pizza_flavors FOR SELECT USING (active = true);
CREATE POLICY "Admins manage pizza flavor prices" ON public.pizza_flavor_prices FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view pizza flavor prices" ON public.pizza_flavor_prices FOR SELECT USING (true);
CREATE POLICY "Admins manage pizza addon groups" ON public.pizza_addon_groups FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view active pizza addon groups" ON public.pizza_addon_groups FOR SELECT USING (active = true);
CREATE POLICY "Admins manage pizza addons" ON public.pizza_addons FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view active pizza addons" ON public.pizza_addons FOR SELECT USING (active = true);
CREATE POLICY "Admins manage store pizza settings" ON public.store_pizza_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view store pizza settings" ON public.store_pizza_settings FOR SELECT USING (true);
CREATE TRIGGER update_pizza_sizes_updated_at BEFORE UPDATE ON public.pizza_sizes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pizza_flavors_updated_at BEFORE UPDATE ON public.pizza_flavors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pizza_addon_groups_updated_at BEFORE UPDATE ON public.pizza_addon_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pizza_addons_updated_at BEFORE UPDATE ON public.pizza_addons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_pizza_settings_updated_at BEFORE UPDATE ON public.store_pizza_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- print settings
CREATE TABLE public.store_print_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE, printer_enabled boolean NOT NULL DEFAULT true, paper_size text NOT NULL DEFAULT '80mm', auto_print_new_orders boolean NOT NULL DEFAULT false, auto_print_copies integer NOT NULL DEFAULT 1, print_on_status text NOT NULL DEFAULT 'accepted', print_templates_enabled jsonb NOT NULL DEFAULT '{"kitchen":true,"counter":true,"delivery":true}'::jsonb, header_logo_url text, footer_message text, show_prices_on_kitchen boolean NOT NULL DEFAULT false, show_qr_pickup boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.order_print_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, template text NOT NULL, copies integer NOT NULL DEFAULT 1, status text NOT NULL DEFAULT 'queued', is_reprint boolean NOT NULL DEFAULT false, printed_at timestamptz, error_message text, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES auth.users(id));
ALTER TABLE public.store_print_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_print_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage print settings" ON public.store_print_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff view print settings" ON public.store_print_settings FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Admins manage print jobs" ON public.order_print_jobs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE TRIGGER update_store_print_settings_updated_at BEFORE UPDATE ON public.store_print_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_print_jobs;
