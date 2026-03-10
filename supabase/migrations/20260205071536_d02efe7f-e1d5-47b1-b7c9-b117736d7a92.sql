-- =============================================
-- LOYALTY POINTS SYSTEM - Complete Schema
-- =============================================

-- 1) Store Loyalty Settings (per-store configuration)
CREATE TABLE public.store_loyalty_settings (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  program_name text NOT NULL DEFAULT 'Pontos Fidelidade',
  earning_rate_points_per_real numeric NOT NULL DEFAULT 1.0,
  min_order_to_earn numeric NOT NULL DEFAULT 0,
  credit_on_status text NOT NULL DEFAULT 'delivered' CHECK (credit_on_status IN ('paid', 'accepted', 'delivered')),
  points_expire_days integer NULL,
  allow_partial_redeem_shipping boolean NOT NULL DEFAULT true,
  max_points_redeem_per_order integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_store_loyalty_settings_updated_at
  BEFORE UPDATE ON public.store_loyalty_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Loyalty Wallets (user point balances per store)
CREATE TABLE public.loyalty_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  points_balance integer NOT NULL DEFAULT 0,
  points_pending integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

CREATE INDEX idx_loyalty_wallets_user ON public.loyalty_wallets(user_id);
CREATE INDEX idx_loyalty_wallets_store ON public.loyalty_wallets(store_id);

CREATE TRIGGER update_loyalty_wallets_updated_at
  BEFORE UPDATE ON public.loyalty_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Loyalty Transaction Types
CREATE TYPE public.loyalty_transaction_type AS ENUM (
  'earn_pending',
  'earn_posted',
  'spend',
  'expire',
  'adjustment',
  'refund_reversal'
);

-- 4) Loyalty Transactions (ledger/history)
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  type public.loyalty_transaction_type NOT NULL,
  points integer NOT NULL,
  description text NOT NULL,
  meta jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_transactions_user_store ON public.loyalty_transactions(store_id, user_id, created_at DESC);
CREATE INDEX idx_loyalty_transactions_order ON public.loyalty_transactions(order_id);

-- 5) Loyalty Reward Types
CREATE TYPE public.loyalty_reward_type AS ENUM (
  'free_shipping',
  'free_item',
  'discount_amount',
  'discount_percent'
);

-- 6) Loyalty Rewards (catalog)
CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NULL,
  type public.loyalty_reward_type NOT NULL,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  active boolean NOT NULL DEFAULT true,
  constraints jsonb NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_rewards_store ON public.loyalty_rewards(store_id, active, sort_order);

CREATE TRIGGER update_loyalty_rewards_updated_at
  BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Loyalty Redemption Status
CREATE TYPE public.loyalty_redemption_status AS ENUM (
  'reserved',
  'applied',
  'cancelled',
  'consumed'
);

-- 8) Loyalty Redemptions (user redemptions)
CREATE TABLE public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE RESTRICT,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  status public.loyalty_redemption_status NOT NULL DEFAULT 'reserved',
  points_spent integer NOT NULL CHECK (points_spent > 0),
  meta jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_redemptions_user ON public.loyalty_redemptions(user_id, created_at DESC);
CREATE INDEX idx_loyalty_redemptions_order ON public.loyalty_redemptions(order_id);

CREATE TRIGGER update_loyalty_redemptions_updated_at
  BEFORE UPDATE ON public.loyalty_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9) Add loyalty columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS loyalty_points_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points_spent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_reward_applied jsonb NULL,
  ADD COLUMN IF NOT EXISTS loyalty_earn_processed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_spend_processed boolean NOT NULL DEFAULT false;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.store_loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- Store Loyalty Settings
CREATE POLICY "Admins can manage store loyalty settings"
  ON public.store_loyalty_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view enabled loyalty settings"
  ON public.store_loyalty_settings FOR SELECT
  USING (enabled = true);

-- Loyalty Wallets
CREATE POLICY "Users can view their own wallet"
  ON public.loyalty_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets"
  ON public.loyalty_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.loyalty_wallets FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can update wallets"
  ON public.loyalty_wallets FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Loyalty Transactions
CREATE POLICY "Users can view their own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can insert transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Loyalty Rewards
CREATE POLICY "Anyone can view active rewards"
  ON public.loyalty_rewards FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage rewards"
  ON public.loyalty_rewards FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Loyalty Redemptions
CREATE POLICY "Users can view their own redemptions"
  ON public.loyalty_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redemptions"
  ON public.loyalty_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reserved redemptions"
  ON public.loyalty_redemptions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'reserved');

CREATE POLICY "Admins can view all redemptions"
  ON public.loyalty_redemptions FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can update redemptions"
  ON public.loyalty_redemptions FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Enable realtime for wallets and transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;