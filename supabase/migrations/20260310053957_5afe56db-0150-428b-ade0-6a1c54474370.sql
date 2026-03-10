
-- billing_plans: add missing columns
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS price_monthly numeric DEFAULT 0;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS price_yearly numeric;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_orders_per_month integer;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_waiters integer DEFAULT 0;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_tables integer DEFAULT 0;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_banners integer DEFAULT 5;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_coupons integer DEFAULT 10;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_promotions integer DEFAULT 5;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_delivery_zones integer DEFAULT 5;
UPDATE public.billing_plans SET slug = code WHERE slug IS NULL;

-- subscriptions: add missing column
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_date timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS final_monthly_price numeric DEFAULT 0;

-- purchase_orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  plan_code text,
  plan_months integer DEFAULT 1,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'pending',
  efi_txid text,
  efi_e2eid text,
  efi_qrcode text,
  efi_qrcode_image text,
  efi_expiration timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchase orders" ON public.purchase_orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Users view own purchases" ON public.purchase_orders FOR SELECT USING (auth.uid() = user_id);

-- vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan_code text,
  plan_months integer DEFAULT 1,
  discount_percent numeric DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active vouchers" ON public.vouchers FOR SELECT USING (active = true);
CREATE POLICY "Admins manage vouchers" ON public.vouchers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- store_subscriptions (separate from subscriptions for owner/store model)
CREATE TABLE IF NOT EXISTS public.store_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'free',
  plan_months integer DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  gateway text,
  gateway_subscription_id text,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage store subs" ON public.store_subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text,
  phone text,
  vehicle_type text,
  license_plate text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage drivers" ON public.drivers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Drivers view self" ON public.drivers FOR SELECT USING (auth.uid() = user_id);

-- store_admin_settings
CREATE TABLE IF NOT EXISTS public.store_admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  order_alert_sound text DEFAULT 'bell',
  order_alert_volume numeric DEFAULT 0.8,
  auto_accept_orders boolean DEFAULT false,
  default_prep_time integer DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage admin settings" ON public.store_admin_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- payment_settings
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  pix_enabled boolean DEFAULT true,
  credit_card_enabled boolean DEFAULT false,
  debit_card_enabled boolean DEFAULT false,
  cash_enabled boolean DEFAULT true,
  pix_key text,
  pix_name text,
  stripe_enabled boolean DEFAULT false,
  mp_enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view payment settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage payment settings" ON public.payment_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
