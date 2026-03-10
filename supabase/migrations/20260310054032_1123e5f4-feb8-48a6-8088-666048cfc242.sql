
-- billing_plans: more missing columns
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_categories integer DEFAULT 999;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS max_users integer DEFAULT 999;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS has_analytics boolean DEFAULT false;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS has_api_access boolean DEFAULT false;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS has_custom_domain boolean DEFAULT false;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS has_priority_support boolean DEFAULT false;

-- purchase_orders: add plan_name
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS plan_name text;

-- waiters: add display_name
ALTER TABLE public.waiters ADD COLUMN IF NOT EXISTS display_name text;

-- store_subscriptions: add more columns for owner detail
ALTER TABLE public.store_subscriptions ADD COLUMN IF NOT EXISTS plan_id uuid;
ALTER TABLE public.store_subscriptions ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';
ALTER TABLE public.store_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;
ALTER TABLE public.store_subscriptions ADD COLUMN IF NOT EXISTS canceled_at timestamptz;
ALTER TABLE public.store_subscriptions ADD COLUMN IF NOT EXISTS owner_user_id uuid;
ALTER TABLE public.store_subscriptions ADD COLUMN IF NOT EXISTS store_name text;

-- billing_invoices
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.store_subscriptions(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'pending',
  due_date timestamptz,
  paid_at timestamptz,
  gateway_invoice_id text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view invoices" ON public.billing_invoices FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- vouchers: add more columns for owner
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS plan_name text;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS type text DEFAULT 'discount';
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS min_plan text;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS owner_user_id uuid;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- create_table_order: add p_table_id parameter
CREATE OR REPLACE FUNCTION public.create_table_order(
  p_store_id uuid,
  p_session_id uuid,
  p_table_id uuid,
  p_items jsonb,
  p_notes text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_item jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'item_total')::numeric;
  END LOOP;

  INSERT INTO orders (store_id, subtotal, total, delivery_type, channel, notes, status)
  VALUES (p_store_id, v_subtotal, v_subtotal, 'table'::delivery_type, 'table', p_notes, 'created'::order_status)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, name_snapshot, quantity, base_price, item_total, options_snapshot)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'name_snapshot',
      COALESCE((v_item->>'quantity')::integer, 1),
      (v_item->>'base_price')::numeric,
      (v_item->>'item_total')::numeric,
      COALESCE(v_item->'options_snapshot', '[]'::jsonb)
    );
  END LOOP;

  INSERT INTO table_session_items (session_id, product_id, name_snapshot, quantity, unit_price, item_total, status)
  SELECT
    p_session_id,
    (el->>'product_id')::uuid,
    el->>'name_snapshot',
    COALESCE((el->>'quantity')::integer, 1),
    (el->>'base_price')::numeric,
    (el->>'item_total')::numeric,
    'confirmed'
  FROM jsonb_array_elements(p_items) AS el;

  UPDATE table_sessions SET total = total + v_subtotal WHERE id = p_session_id;

  RETURN v_order_id::text;
END;
$$;
