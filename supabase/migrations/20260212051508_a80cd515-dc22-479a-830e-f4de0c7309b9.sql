
-- Create table_calls for waiter call requests
CREATE TABLE public.table_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  table_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  table_number int NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendido', 'cancelado')),
  message text,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  attended_at timestamptz,
  attended_by_user_id uuid
);

-- Add anti-spam column to table_sessions
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS last_call_at timestamptz;

-- Enable RLS
ALTER TABLE public.table_calls ENABLE ROW LEVEL SECURITY;

-- Public can INSERT calls (anonymous QR code users)
CREATE POLICY "Anyone can create table calls"
ON public.table_calls FOR INSERT
WITH CHECK (true);

-- Public can SELECT table calls (for client status view)
CREATE POLICY "Anyone can view table calls"
ON public.table_calls FOR SELECT
USING (true);

-- Admins/staff can UPDATE calls (attend/cancel)
CREATE POLICY "Staff can update table calls"
ON public.table_calls FOR UPDATE
USING (
  public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin','staff']::store_role[])
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_calls;

-- Index for fast pending lookups
CREATE INDEX idx_table_calls_store_status ON public.table_calls(store_id, status);
CREATE INDEX idx_table_calls_created ON public.table_calls(created_at DESC);
