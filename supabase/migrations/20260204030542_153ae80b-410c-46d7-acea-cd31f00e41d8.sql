-- Add 'rejected' to order_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = 'public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'rejected' AFTER 'canceled';
  END IF;
END$$;

-- Add cancel_reason and reject_reason columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancel_reason text,
ADD COLUMN IF NOT EXISTS reject_reason text;