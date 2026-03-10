
-- restaurant_tables: add missing columns
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- table_sessions: add missing columns
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS opened_by_waiter_id uuid;
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS push_subscription jsonb;

-- waiters table
CREATE TABLE IF NOT EXISTS public.waiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage waiters" ON public.waiters FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Waiters view self" ON public.waiters FOR SELECT USING (auth.uid() = user_id);

-- waiter_assignments
CREATE TABLE IF NOT EXISTS public.waiter_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  waiter_id uuid NOT NULL REFERENCES public.waiters(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waiter_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage assignments" ON public.waiter_assignments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- billing_plans
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  monthly_price numeric DEFAULT 0,
  annual_price numeric,
  features jsonb DEFAULT '[]'::jsonb,
  max_products integer,
  max_orders_month integer,
  max_admins integer DEFAULT 1,
  max_drivers integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view plans" ON public.billing_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage plans" ON public.billing_plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- subscriptions: add missing columns
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount_per_cycle numeric DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 2;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS mp_payer_email text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_at timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_amount numeric;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_mp_status text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_due_date timestamptz;

-- create_table_order function
CREATE OR REPLACE FUNCTION public.create_table_order(
  p_store_id uuid,
  p_session_id uuid,
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
    (v_item->>'product_id')::uuid,
    v_item->>'name_snapshot',
    COALESCE((v_item->>'quantity')::integer, 1),
    (v_item->>'base_price')::numeric,
    (v_item->>'item_total')::numeric,
    'confirmed'
  FROM jsonb_array_elements(p_items) AS v_item;

  UPDATE table_sessions SET total = total + v_subtotal WHERE id = p_session_id;

  RETURN v_order_id::text;
END;
$$;

-- reviews table: add store_id if not there (for the review hooks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='store_id') THEN
    ALTER TABLE public.reviews ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;
