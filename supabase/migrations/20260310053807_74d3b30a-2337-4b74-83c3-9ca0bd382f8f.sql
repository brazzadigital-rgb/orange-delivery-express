
-- Fix security definer views
ALTER VIEW public.v_sales_daily SET (security_invoker = on);
ALTER VIEW public.v_sales_hourly SET (security_invoker = on);
ALTER VIEW public.v_orders_enriched SET (security_invoker = on);

-- user_privacy_settings
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  show_name_to_store boolean DEFAULT true,
  allow_promotional_contact boolean DEFAULT true,
  share_location_during_delivery boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own privacy" ON public.user_privacy_settings FOR ALL USING (auth.uid() = user_id);

-- account_deletion_requests
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deletion" ON public.account_deletion_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view deletions" ON public.account_deletion_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'free',
  plan_months integer DEFAULT 1,
  base_monthly_price numeric DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  final_monthly_price numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  gateway text,
  gateway_subscription_id text,
  gateway_customer_id text,
  mp_preapproval_id text,
  mp_init_point text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- subscription_payments
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'pending',
  method text,
  gateway_payment_id text,
  paid_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view sub payments" ON public.subscription_payments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- table_calls: add missing columns
ALTER TABLE public.table_calls ADD COLUMN IF NOT EXISTS table_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.table_calls ADD COLUMN IF NOT EXISTS table_number integer;
ALTER TABLE public.table_calls ADD COLUMN IF NOT EXISTS attended_at timestamptz;
ALTER TABLE public.table_calls ADD COLUMN IF NOT EXISTS attended_by_user_id uuid;

-- table_sessions: add missing column
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS last_call_at timestamptz;

-- get_store_plan_entitlements function
CREATE OR REPLACE FUNCTION public.get_store_plan_entitlements(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
BEGIN
  SELECT * INTO v_settings FROM billing_settings WHERE store_id = p_store_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'plan_slug', 'free', 'plan_name', 'Grátis',
      'max_products', 20, 'max_categories', 5,
      'max_orders_month', 50, 'max_admins', 1,
      'max_drivers', 0, 'max_waiters', 0,
      'max_tables', 0, 'max_banners', 2,
      'max_coupons', 3, 'max_promotions', 2,
      'max_delivery_zones', 2,
      'features', '[]'::jsonb,
      'is_unlimited', false
    );
  END IF;
  RETURN jsonb_build_object(
    'plan_slug', COALESCE(v_settings.plan_name, 'free'), 'plan_name', COALESCE(v_settings.plan_name, 'Grátis'),
    'max_products', COALESCE(v_settings.max_products, 999), 'max_categories', 999,
    'max_orders_month', COALESCE(v_settings.max_orders_month, 999), 'max_admins', COALESCE(v_settings.max_admins, 1),
    'max_drivers', COALESCE(v_settings.max_drivers, 0), 'max_waiters', 0,
    'max_tables', 0, 'max_banners', 10,
    'max_coupons', 99, 'max_promotions', 99,
    'max_delivery_zones', 99,
    'features', COALESCE(v_settings.features_json, '[]'::jsonb),
    'is_unlimited', v_settings.plan_name = 'pro'
  );
END;
$$;

-- get_store_current_usage function
CREATE OR REPLACE FUNCTION public.get_store_current_usage(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_orders integer;
  v_products integer;
  v_categories integer;
  v_users integer;
  v_drivers integer;
BEGIN
  SELECT COUNT(*) INTO v_orders FROM orders WHERE store_id = p_store_id AND created_at >= date_trunc('month', now());
  SELECT COUNT(*) INTO v_products FROM products WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_categories FROM categories WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_users FROM store_users WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_drivers FROM store_users WHERE store_id = p_store_id AND role = 'driver'::store_role;
  RETURN jsonb_build_object(
    'orders_this_month', v_orders,
    'products_count', v_products,
    'categories_count', v_categories,
    'users_count', v_users,
    'drivers_count', v_drivers
  );
END;
$$;
