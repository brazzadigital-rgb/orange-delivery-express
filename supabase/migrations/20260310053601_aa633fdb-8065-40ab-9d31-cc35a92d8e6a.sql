
-- store_app_review_settings
CREATE TABLE IF NOT EXISTS public.store_app_review_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  enabled boolean DEFAULT true,
  min_days_between_reviews integer DEFAULT 30,
  play_store_url text,
  app_store_url text,
  min_rating_for_store integer DEFAULT 4,
  ask_after_orders integer DEFAULT 3,
  prompt_message text DEFAULT 'Gostou do nosso app? Deixe sua avaliação!',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_app_review_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view review settings" ON public.store_app_review_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage review settings" ON public.store_app_review_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- billing_settings
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  plan_name text DEFAULT 'free',
  monthly_price numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  trial_ends_at timestamptz,
  subscription_status text DEFAULT 'active',
  payment_method text,
  next_billing_at timestamptz,
  max_orders_month integer,
  max_products integer,
  max_admins integer DEFAULT 1,
  max_drivers integer DEFAULT 0,
  features_json jsonb DEFAULT '{}'::jsonb,
  gateway_subscription_id text,
  gateway_customer_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner/admins view billing" ON public.billing_settings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins manage billing" ON public.billing_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- billing_payments
CREATE TABLE IF NOT EXISTS public.billing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view payments" ON public.billing_payments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- store_home_sections
CREATE TABLE IF NOT EXISTS public.store_home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  label text NOT NULL,
  enabled boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, section_key)
);
ALTER TABLE public.store_home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view home sections" ON public.store_home_sections FOR SELECT USING (true);
CREATE POLICY "Admins manage home sections" ON public.store_home_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- app_reviews: add missing columns
ALTER TABLE public.app_reviews ADD COLUMN IF NOT EXISTS contact_allowed boolean DEFAULT false;
ALTER TABLE public.app_reviews ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web';
ALTER TABLE public.app_reviews ADD COLUMN IF NOT EXISTS app_version text;

-- can_submit_review function
CREATE OR REPLACE FUNCTION public.can_submit_review(p_user_id uuid, p_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
  v_last_review timestamptz;
BEGIN
  SELECT * INTO v_settings FROM store_app_review_settings WHERE store_id = p_store_id;
  IF NOT FOUND OR v_settings.enabled = false THEN RETURN false; END IF;
  SELECT MAX(created_at) INTO v_last_review FROM app_reviews WHERE user_id = p_user_id AND store_id = p_store_id;
  IF v_last_review IS NOT NULL AND v_last_review > now() - (v_settings.min_days_between_reviews || ' days')::interval THEN RETURN false; END IF;
  RETURN true;
END;
$$;

-- get_billing_gate function
CREATE OR REPLACE FUNCTION public.get_billing_gate(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
BEGIN
  SELECT * INTO v_settings FROM billing_settings WHERE store_id = p_store_id;
  IF NOT FOUND THEN RETURN '{"allowed":true,"plan":"free"}'::jsonb; END IF;
  RETURN jsonb_build_object('allowed', v_settings.subscription_status = 'active' OR v_settings.subscription_status = 'trialing', 'plan', v_settings.plan_name, 'status', v_settings.subscription_status);
END;
$$;

-- v_sales_daily view (using correct enum value 'canceled')
CREATE OR REPLACE VIEW public.v_sales_daily AS
SELECT
  store_id,
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS order_count,
  SUM(total) AS revenue,
  COALESCE(SUM(delivery_fee), 0) AS delivery_fees,
  COALESCE(SUM(discount), 0) AS discounts
FROM public.orders
WHERE status NOT IN ('canceled'::order_status, 'rejected'::order_status)
GROUP BY store_id, date_trunc('day', created_at)::date;

-- store_loyalty_settings: add missing columns
ALTER TABLE public.store_loyalty_settings ADD COLUMN IF NOT EXISTS reais_per_point numeric DEFAULT 1;
ALTER TABLE public.store_loyalty_settings ADD COLUMN IF NOT EXISTS points_expire_days integer;
ALTER TABLE public.store_loyalty_settings ADD COLUMN IF NOT EXISTS allow_partial_redeem_shipping boolean DEFAULT false;
ALTER TABLE public.store_loyalty_settings ADD COLUMN IF NOT EXISTS max_points_redeem_per_order integer;
ALTER TABLE public.store_loyalty_settings ADD COLUMN IF NOT EXISTS auto_credit_enabled boolean DEFAULT true;
