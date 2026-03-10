-- Add 'trial' and 'cancelled' to billing_settings status check constraint
ALTER TABLE public.billing_settings DROP CONSTRAINT billing_settings_status_check;
ALTER TABLE public.billing_settings ADD CONSTRAINT billing_settings_status_check 
  CHECK (status = ANY (ARRAY['active', 'past_due', 'suspended', 'pending', 'trial', 'cancelled']));
