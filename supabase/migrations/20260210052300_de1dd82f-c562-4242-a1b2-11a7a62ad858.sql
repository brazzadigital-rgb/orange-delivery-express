
-- Add plan columns to billing_settings
ALTER TABLE public.billing_settings
  ADD COLUMN IF NOT EXISTS current_plan_code text,
  ADD COLUMN IF NOT EXISTS current_plan_months integer,
  ADD COLUMN IF NOT EXISTS current_plan_amount numeric,
  ADD COLUMN IF NOT EXISTS current_plan_discount_percent integer DEFAULT 0;

-- Update existing row to have default plan values and active status
UPDATE public.billing_settings
SET current_plan_code = 'monthly',
    current_plan_months = 1,
    current_plan_amount = 250.00,
    current_plan_discount_percent = 0,
    monthly_price = 250.00,
    status = 'active',
    last_mp_status = 'authorized',
    next_due_date = (CURRENT_DATE + INTERVAL '30 days')::date
WHERE current_plan_code IS NULL;
