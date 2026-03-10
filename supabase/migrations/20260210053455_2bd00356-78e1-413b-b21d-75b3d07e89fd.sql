
-- ==============================================
-- Per-user subscriptions table
-- ==============================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id),
  plan_code text NOT NULL DEFAULT 'monthly',
  plan_months integer NOT NULL DEFAULT 1,
  base_monthly_price numeric NOT NULL DEFAULT 250,
  discount_percent integer NOT NULL DEFAULT 0,
  amount_per_cycle numeric NOT NULL DEFAULT 250,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending',
  grace_period_days integer NOT NULL DEFAULT 2,
  mp_preapproval_id text UNIQUE,
  mp_init_point text,
  mp_payer_email text,
  last_mp_status text,
  next_due_date date,
  last_payment_date timestamptz,
  last_payment_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Store owners/admins can view all subscriptions for their store
CREATE POLICY "Store owners can view all store subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  );

-- Store owners/admins can update any subscription in their store
CREATE POLICY "Store owners can update store subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (
    has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  );

-- Super admins can do everything
CREATE POLICY "Super admins manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ==============================================
-- Per-user subscription payments table
-- ==============================================
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id),
  mp_payment_id text UNIQUE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own subscription payments"
  ON public.subscription_payments FOR SELECT
  USING (auth.uid() = user_id);

-- Store owners can view all payments for their store
CREATE POLICY "Store owners can view store subscription payments"
  ON public.subscription_payments FOR SELECT
  USING (
    has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  );

-- Super admins can do everything
CREATE POLICY "Super admins manage all subscription payments"
  ON public.subscription_payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ==============================================
-- Function to check user subscription gate
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_user_subscription_gate(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sub subscriptions;
  v_grace interval;
BEGIN
  -- Check if user is a super admin or store owner — always pass
  IF has_role(p_user_id, 'admin'::app_role) THEN
    RETURN 'open';
  END IF;

  -- Check if user is a store owner/admin in any store — always pass
  IF EXISTS (
    SELECT 1 FROM store_users 
    WHERE user_id = p_user_id 
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN 'open';
  END IF;

  -- Get user subscription
  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_user_id LIMIT 1;

  -- No subscription = allow (free tier / no subscription required yet)
  IF NOT FOUND THEN
    RETURN 'open';
  END IF;

  IF v_sub.status = 'active' THEN
    IF v_sub.next_due_date IS NOT NULL THEN
      v_grace := (v_sub.grace_period_days || ' days')::interval;
      IF now()::date > v_sub.next_due_date + v_grace THEN
        RETURN 'blocked';
      ELSIF now()::date > v_sub.next_due_date THEN
        RETURN 'past_due';
      END IF;
    END IF;
    RETURN 'open';
  END IF;

  IF v_sub.status = 'past_due' THEN
    RETURN 'past_due';
  END IF;

  IF v_sub.status IN ('suspended', 'cancelled') THEN
    RETURN 'blocked';
  END IF;

  IF v_sub.status = 'pending' THEN
    RETURN 'blocked';
  END IF;

  RETURN 'blocked';
END;
$$;

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
