
-- =============================================
-- RESTORE MISSING SCHEMA FROM ORIGINAL MIGRATIONS
-- =============================================

-- 1. Missing enums
DO $$ BEGIN CREATE TYPE public.store_type AS ENUM ('pizzaria','hamburgueria','bebidas','sushi','acai','padaria','restaurante','generico'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.loyalty_transaction_type AS ENUM ('earn_pending','earn_posted','spend','expire','adjustment','refund_reversal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.loyalty_reward_type AS ENUM ('free_shipping','free_item','discount_amount','discount_percent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.loyalty_redemption_status AS ENUM ('reserved','applied','cancelled','consumed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE public.store_role ADD VALUE IF NOT EXISTS 'driver';

-- 2. Missing columns on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.restaurant_tables(id),
  ADD COLUMN IF NOT EXISTS table_session_id uuid,
  ADD COLUMN IF NOT EXISTS waiter_user_id uuid,
  ADD COLUMN IF NOT EXISTS kitchen_status text NOT NULL DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS created_by_source text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS original_table_number int,
  ADD COLUMN IF NOT EXISTS original_session_id uuid;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='orders_table_session_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_table_session_id_fkey FOREIGN KEY (table_session_id) REFERENCES public.table_sessions(id);
  END IF;
END $$;

-- 3. Missing columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- 4. Missing columns on table_sessions
ALTER TABLE public.table_sessions
  ADD COLUMN IF NOT EXISTS session_kind text NOT NULL DEFAULT 'single' CHECK (session_kind IN ('single','master','merged')),
  ADD COLUMN IF NOT EXISTS merged_into_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_tables text,
  ADD COLUMN IF NOT EXISTS merged_at timestamptz;

-- 5. Missing column on restaurant_tables
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS table_pin text;

-- 6. Missing columns on subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'mercadopago',
  ADD COLUMN IF NOT EXISTS efi_txid text,
  ADD COLUMN IF NOT EXISTS efi_pix_copia_cola text,
  ADD COLUMN IF NOT EXISTS efi_qrcode_image text;

ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'mercadopago',
  ADD COLUMN IF NOT EXISTS provider_payment_id text;

-- 7. Missing FK on subscriptions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='subscriptions_user_id_fkey') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- 8. Missing columns on pizza builder
ALTER TABLE public.store_pizza_settings ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'matrix';
ALTER TABLE public.pizza_flavors ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
ALTER TABLE public.pizza_sizes ADD COLUMN IF NOT EXISTS unit_label text DEFAULT NULL;
ALTER TABLE public.pizza_sizes ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

-- 9. Missing tables
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_event_id text,
  topic text,
  mp_resource_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='billing_events' AND policyname='Only admins can read billing_events') THEN
    CREATE POLICY "Only admins can read billing_events" ON public.billing_events FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cep_cache (
  cep text PRIMARY KEY,
  street text, neighborhood text, city text NOT NULL, state text NOT NULL,
  country text DEFAULT 'BR', lat numeric, lng numeric,
  source text DEFAULT 'google', confidence text DEFAULT 'high',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cep_cache ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cep_cache_updated ON cep_cache(updated_at);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cep_cache' AND policyname='Anyone can read CEP cache') THEN
    CREATE POLICY "Anyone can read CEP cache" ON public.cep_cache FOR SELECT USING (true);
  END IF;
END $$;
CREATE TRIGGER update_cep_cache_updated_at BEFORE UPDATE ON public.cep_cache FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.store_payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  efi_enabled boolean NOT NULL DEFAULT true,
  mp_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);
ALTER TABLE public.store_payment_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_payment_settings' AND policyname='Admins can manage payment settings') THEN
    CREATE POLICY "Admins can manage payment settings" ON public.store_payment_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_payment_settings' AND policyname='Anyone can read payment settings') THEN
    CREATE POLICY "Anyone can read payment settings" ON public.store_payment_settings FOR SELECT USING (true);
  END IF;
END $$;
CREATE TRIGGER update_store_payment_settings_updated_at BEFORE UPDATE ON public.store_payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.table_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'web' CHECK (channel IN ('push','web')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.table_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='table_notifications' AND policyname='Public can read table notifications') THEN
    CREATE POLICY "Public can read table notifications" ON public.table_notifications FOR SELECT USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.table_session_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'active',
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz, revoked_at timestamptz, last_used_at timestamptz,
  is_verified boolean NOT NULL DEFAULT false,
  device_fingerprint text, ip_hash text
);
CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON public.table_session_tokens(token);
CREATE INDEX IF NOT EXISTS idx_session_tokens_session ON public.table_session_tokens(table_session_id);
ALTER TABLE public.table_session_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='table_session_tokens' AND policyname='Anyone can read session tokens for validation') THEN
    CREATE POLICY "Anyone can read session tokens for validation" ON public.table_session_tokens FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='table_session_tokens' AND policyname='Session tokens can be created for open sessions') THEN
    CREATE POLICY "Session tokens can be created for open sessions" ON public.table_session_tokens FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.table_sessions ts WHERE ts.id = table_session_id AND ts.status = 'open'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='table_session_tokens' AND policyname='Session tokens can be updated for validation') THEN
    CREATE POLICY "Session tokens can be updated for validation" ON public.table_session_tokens FOR UPDATE USING (EXISTS (SELECT 1 FROM public.table_sessions ts WHERE ts.id = table_session_id AND (ts.status = 'open' OR public.has_store_role(auth.uid(), ts.store_id, ARRAY['owner','admin','staff']::store_role[]))));
  END IF;
END $$;
