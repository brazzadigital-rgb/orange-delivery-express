
-- Billing settings (single row for the app subscription)
CREATE TABLE public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL DEFAULT 'Plano Mensal',
  monthly_price numeric NOT NULL DEFAULT 99.90,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active','past_due','suspended','pending')),
  grace_period_days integer NOT NULL DEFAULT 2,
  mp_preapproval_id text UNIQUE,
  mp_init_point text,
  mp_payer_email text,
  next_due_date date,
  last_payment_date timestamptz,
  last_payment_amount numeric,
  last_mp_status text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read billing_settings"
  ON public.billing_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert billing_settings"
  ON public.billing_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update billing_settings"
  ON public.billing_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role (edge functions) to read for gate checks
CREATE POLICY "Service can read billing for gate"
  ON public.billing_settings FOR SELECT
  USING (true);

-- Billing events (webhook audit log)
CREATE TABLE public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_event_id text,
  topic text,
  mp_resource_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read billing_events"
  ON public.billing_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Billing payments (history)
CREATE TABLE public.billing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_payment_id text UNIQUE,
  mp_preapproval_id text,
  amount numeric,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read billing_payments"
  ON public.billing_payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial billing_settings row
INSERT INTO public.billing_settings (plan_name, monthly_price, status) 
VALUES ('Plano Mensal', 99.90, 'pending');

-- Create a function to check billing gate (usable from edge functions and frontend)
CREATE OR REPLACE FUNCTION public.get_billing_gate()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings billing_settings;
  v_grace interval;
BEGIN
  SELECT * INTO v_settings FROM billing_settings LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN 'blocked';
  END IF;
  
  -- If active, check due date
  IF v_settings.status = 'active' THEN
    IF v_settings.next_due_date IS NOT NULL THEN
      v_grace := (v_settings.grace_period_days || ' days')::interval;
      IF now()::date > v_settings.next_due_date + v_grace THEN
        RETURN 'blocked';
      ELSIF now()::date > v_settings.next_due_date THEN
        RETURN 'past_due';
      END IF;
    END IF;
    RETURN 'open';
  END IF;
  
  -- If past_due in settings
  IF v_settings.status = 'past_due' THEN
    RETURN 'past_due';
  END IF;
  
  -- pending or suspended
  RETURN 'blocked';
END;
$$;
