-- Add cash change fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cash_change_needed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cash_change_for numeric NULL,
ADD COLUMN IF NOT EXISTS cash_change_amount numeric NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.cash_change_needed IS 'Whether customer needs change for cash payment';
COMMENT ON COLUMN public.orders.cash_change_for IS 'Amount customer will pay with (e.g., R$100)';
COMMENT ON COLUMN public.orders.cash_change_amount IS 'Calculated change to return (cash_change_for - total)';