
-- 1. Add store_type column to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS store_type text DEFAULT 'pizzaria';

-- 2. store_features table
CREATE TABLE IF NOT EXISTS public.store_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);
ALTER TABLE public.store_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store features" ON public.store_features FOR SELECT USING (true);
CREATE POLICY "Admins manage store features" ON public.store_features FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. store_loyalty_settings
CREATE TABLE IF NOT EXISTS public.store_loyalty_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  program_name text DEFAULT 'Programa de Fidelidade',
  earning_rate_points_per_real numeric DEFAULT 1,
  min_order_to_earn numeric DEFAULT 0,
  auto_credit boolean DEFAULT true,
  credit_on_status text DEFAULT 'delivered',
  welcome_bonus integer DEFAULT 0,
  expiry_days integer DEFAULT 365,
  max_discount_pct numeric DEFAULT 100,
  max_points_per_order integer DEFAULT null,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_loyalty_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view loyalty settings" ON public.store_loyalty_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage loyalty settings" ON public.store_loyalty_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. loyalty_rewards
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'discount_amount',
  points_cost integer NOT NULL DEFAULT 100,
  active boolean DEFAULT true,
  constraints jsonb DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active rewards" ON public.loyalty_rewards FOR SELECT USING (active = true);
CREATE POLICY "Admins manage rewards" ON public.loyalty_rewards FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. loyalty_wallets
CREATE TABLE IF NOT EXISTS public.loyalty_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  points_balance integer NOT NULL DEFAULT 0,
  points_pending integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);
ALTER TABLE public.loyalty_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.loyalty_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage wallets" ON public.loyalty_wallets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. loyalty_transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL,
  points integer NOT NULL,
  description text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage transactions" ON public.loyalty_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. loyalty_redemptions
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reward_id uuid REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points_spent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own redemptions" ON public.loyalty_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage redemptions" ON public.loyalty_redemptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. restaurant_tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  number integer NOT NULL,
  label text,
  status text NOT NULL DEFAULT 'available',
  capacity integer DEFAULT 4,
  qr_token text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, number)
);
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active tables" ON public.restaurant_tables FOR SELECT USING (active = true);
CREATE POLICY "Admins manage tables" ON public.restaurant_tables FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. table_sessions
CREATE TABLE IF NOT EXISTS public.table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  opened_by uuid,
  closed_by uuid,
  status text NOT NULL DEFAULT 'open',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  total numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sessions" ON public.table_sessions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Waiters view sessions" ON public.table_sessions FOR SELECT USING (has_role(auth.uid(), 'waiter'::app_role));

-- 10. table_session_items
CREATE TABLE IF NOT EXISTS public.table_session_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  name_snapshot text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  item_total numeric NOT NULL,
  options_snapshot jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.table_session_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage session items" ON public.table_session_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- 11. table_calls
CREATE TABLE IF NOT EXISTS public.table_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'waiter',
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  answered_by uuid
);
ALTER TABLE public.table_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage calls" ON public.table_calls FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Anyone can create calls" ON public.table_calls FOR INSERT WITH CHECK (true);

-- 12. app_reviews
CREATE TABLE IF NOT EXISTS public.app_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean DEFAULT false,
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reviews" ON public.app_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone view public reviews" ON public.app_reviews FOR SELECT USING (is_public = true);
CREATE POLICY "Users create own reviews" ON public.app_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.app_reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 13. notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  order_updates boolean DEFAULT true,
  promotions boolean DEFAULT true,
  loyalty boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- 14. approve_loyalty_points function
CREATE OR REPLACE FUNCTION public.approve_loyalty_points(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND loyalty_earn_processed = false AND loyalty_points_earned > 0;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_wallet FROM loyalty_wallets WHERE store_id = v_order.store_id AND user_id = v_order.user_id;
  IF NOT FOUND THEN
    INSERT INTO loyalty_wallets (store_id, user_id, points_balance, points_pending, lifetime_earned, lifetime_spent)
    VALUES (v_order.store_id, v_order.user_id, 0, 0, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  UPDATE loyalty_wallets SET points_balance = points_balance + v_order.loyalty_points_earned, lifetime_earned = lifetime_earned + v_order.loyalty_points_earned WHERE id = v_wallet.id;
  INSERT INTO loyalty_transactions (store_id, user_id, type, points, description, order_id) VALUES (v_order.store_id, v_order.user_id, 'earn', v_order.loyalty_points_earned, 'Pontos do pedido #' || v_order.order_number, v_order.id);
  UPDATE orders SET loyalty_earn_processed = true WHERE id = p_order_id;
  RETURN true;
END;
$$;

-- 15. Missing SELECT policies for orders
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers view assigned orders" ON public.orders FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Drivers can update assigned orders" ON public.orders FOR UPDATE USING (auth.uid() = driver_id);

-- 16. Missing CUD policies for categories/products
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
