
-- merged_tables
CREATE TABLE IF NOT EXISTS public.merged_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  table_number integer NOT NULL,
  merged_from_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.merged_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage merged tables" ON public.merged_tables FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- store_app_review_settings: add missing columns
ALTER TABLE public.store_app_review_settings ADD COLUMN IF NOT EXISTS review_prompt_title text DEFAULT 'Avalie nosso app';
ALTER TABLE public.store_app_review_settings ADD COLUMN IF NOT EXISTS review_prompt_subtitle text DEFAULT 'Sua opinião é importante!';
ALTER TABLE public.store_app_review_settings ADD COLUMN IF NOT EXISTS thank_you_message text DEFAULT 'Obrigado pela avaliação!';

-- billing_settings: add missing columns
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 2;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS mp_preapproval_id text;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS mp_init_point text;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS mp_payer_email text;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS next_due_date timestamptz;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS last_payment_date timestamptz;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS last_payment_amount numeric;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS last_mp_status text;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS current_plan_code text;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS current_plan_months integer;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS current_plan_amount numeric;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS current_plan_discount_percent numeric;

-- v_sales_hourly view
CREATE OR REPLACE VIEW public.v_sales_hourly AS
SELECT
  store_id,
  EXTRACT(HOUR FROM created_at)::integer AS hour,
  COUNT(*) AS orders_count,
  SUM(total) AS gross_revenue,
  CASE WHEN COUNT(*) > 0 THEN SUM(total) / COUNT(*) ELSE 0 END AS aov
FROM public.orders
WHERE status NOT IN ('canceled'::order_status, 'rejected'::order_status)
GROUP BY store_id, EXTRACT(HOUR FROM created_at)::integer;

-- v_orders_enriched view
CREATE OR REPLACE VIEW public.v_orders_enriched AS
SELECT
  o.id,
  o.store_id,
  o.order_number,
  o.status::text AS status,
  o.total,
  o.payment_method::text AS payment_method,
  o.payment_status::text AS payment_status,
  o.created_at,
  COALESCE(p.name, 'Anônimo') AS customer_name,
  NULL::numeric AS time_to_accept_min,
  NULL::numeric AS prep_time_min,
  NULL::numeric AS delivery_time_min,
  NULL::numeric AS total_cycle_time_min
FROM public.orders o
LEFT JOIN public.profiles p ON p.id = o.user_id;

-- Update v_sales_daily to include more columns expected by code
DROP VIEW IF EXISTS public.v_sales_daily;
CREATE OR REPLACE VIEW public.v_sales_daily AS
SELECT
  store_id,
  date_trunc('day', created_at)::date AS day,
  date_trunc('day', created_at)::date AS date,
  COUNT(*) AS order_count,
  COUNT(*) AS orders_count,
  SUM(total) AS revenue,
  SUM(total) AS gross_revenue,
  SUM(total) - COALESCE(SUM(discount), 0) - COALESCE(SUM(delivery_fee), 0) AS net_revenue,
  COALESCE(SUM(delivery_fee), 0) AS delivery_fees,
  COALESCE(SUM(delivery_fee), 0) AS delivery_fee_sum,
  COALESCE(SUM(discount), 0) AS discounts,
  COALESCE(SUM(discount), 0) AS discounts_sum,
  CASE WHEN COUNT(*) > 0 THEN SUM(total) / COUNT(*) ELSE 0 END AS aov,
  0::numeric AS paid_rate,
  CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'canceled'::order_status))::numeric / COUNT(*)::numeric ELSE 0 END AS cancel_rate,
  CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE delivery_type = 'delivery'::delivery_type))::numeric / COUNT(*)::numeric ELSE 0 END AS delivery_share,
  CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE delivery_type = 'pickup'::delivery_type))::numeric / COUNT(*)::numeric ELSE 0 END AS pickup_share,
  0::numeric AS table_share
FROM public.orders
WHERE status NOT IN ('canceled'::order_status, 'rejected'::order_status)
GROUP BY store_id, date_trunc('day', created_at)::date;
