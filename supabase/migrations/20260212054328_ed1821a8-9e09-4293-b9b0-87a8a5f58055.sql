ALTER TABLE public.table_sessions 
  ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS opened_by_source text DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_notes text DEFAULT NULL;