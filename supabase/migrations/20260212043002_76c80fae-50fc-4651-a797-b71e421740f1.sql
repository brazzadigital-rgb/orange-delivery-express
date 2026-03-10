
-- Step 2: Create all tables and policies for Table Orders module

-- 1) Restaurant tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  number int NOT NULL,
  name text,
  area text,
  is_active boolean NOT NULL DEFAULT true,
  qr_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, number)
);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage tables" ON public.restaurant_tables
  FOR ALL USING (
    public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin','staff']::store_role[])
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Public can read active tables" ON public.restaurant_tables
  FOR SELECT USING (is_active = true);

-- 2) Table sessions
CREATE TABLE IF NOT EXISTS public.table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opened_by_waiter_id uuid,
  customer_name text,
  customer_phone text,
  push_subscription jsonb
);

ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage table sessions" ON public.table_sessions
  FOR ALL USING (
    public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin','staff']::store_role[])
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'waiter'::app_role)
  );

CREATE POLICY "Anon can insert table sessions" ON public.table_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read table sessions" ON public.table_sessions
  FOR SELECT USING (true);

-- 3) Add table columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.restaurant_tables(id),
  ADD COLUMN IF NOT EXISTS table_session_id uuid,
  ADD COLUMN IF NOT EXISTS waiter_user_id uuid,
  ADD COLUMN IF NOT EXISTS kitchen_status text NOT NULL DEFAULT 'received';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_table_session_id_fkey'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_table_session_id_fkey 
      FOREIGN KEY (table_session_id) REFERENCES public.table_sessions(id);
  END IF;
END $$;

-- 4) Waiters
CREATE TABLE IF NOT EXISTS public.waiters (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage waiters" ON public.waiters
  FOR ALL USING (
    public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin','staff']::store_role[])
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Waiters can read own" ON public.waiters
  FOR SELECT USING (user_id = auth.uid());

-- 5) Waiter assignments
CREATE TABLE IF NOT EXISTS public.waiter_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  waiter_user_id uuid NOT NULL REFERENCES public.waiters(user_id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  area text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waiter_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage assignments" ON public.waiter_assignments
  FOR ALL USING (
    public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin','staff']::store_role[])
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Waiters can read own assignments" ON public.waiter_assignments
  FOR SELECT USING (waiter_user_id = auth.uid());

-- 6) Table notifications
CREATE TABLE IF NOT EXISTS public.table_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'web' CHECK (channel IN ('push', 'web')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.table_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read table notifications" ON public.table_notifications
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage table notifications" ON public.table_notifications
  FOR ALL USING (
    public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin','staff']::store_role[])
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'waiter'::app_role)
  );

-- 7) Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_notifications;

-- 8) Security definer function for anonymous table order creation
CREATE OR REPLACE FUNCTION public.create_table_order(
  p_store_id uuid,
  p_table_id uuid,
  p_table_session_id uuid,
  p_customer_name text DEFAULT NULL,
  p_payment_method text DEFAULT 'cash',
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_subtotal numeric := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_tables 
    WHERE id = p_table_id AND store_id = p_store_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Mesa não encontrada ou inativa';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + (v_item->>'item_total')::numeric;
  END LOOP;

  INSERT INTO orders (
    store_id, user_id, status, delivery_type, 
    table_id, table_session_id, kitchen_status,
    subtotal, delivery_fee, discount, total,
    payment_method, payment_status, notes
  ) VALUES (
    p_store_id,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'created', 'table',
    p_table_id, p_table_session_id, 'received',
    v_subtotal, 0, 0, v_subtotal,
    p_payment_method::payment_method, 'pending', p_notes
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id, product_id, name_snapshot, quantity, base_price, options_snapshot, item_total
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'name_snapshot',
      COALESCE((v_item->>'quantity')::int, 1),
      (v_item->>'base_price')::numeric,
      COALESCE(v_item->'options_snapshot', '[]'::jsonb),
      (v_item->>'item_total')::numeric
    );
  END LOOP;

  INSERT INTO order_events (order_id, status, message)
  VALUES (v_order_id, 'created', 'Pedido de mesa criado');

  RETURN v_order_id;
END;
$$;
