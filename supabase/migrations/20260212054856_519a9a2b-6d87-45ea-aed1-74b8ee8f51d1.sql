
-- 1) Create merged_tables relation table
CREATE TABLE public.merged_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  table_number int NOT NULL,
  merged_from_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merged_tables ENABLE ROW LEVEL SECURITY;

-- RLS policies for merged_tables (admin/staff access)
CREATE POLICY "Staff can view merged_tables" ON public.merged_tables
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Staff can insert merged_tables" ON public.merged_tables
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update merged_tables" ON public.merged_tables
  FOR UPDATE TO authenticated
  USING (true);

-- 2) Add columns to table_sessions
ALTER TABLE public.table_sessions
  ADD COLUMN IF NOT EXISTS session_kind text NOT NULL DEFAULT 'single' CHECK (session_kind IN ('single', 'master', 'merged')),
  ADD COLUMN IF NOT EXISTS merged_into_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_tables text,
  ADD COLUMN IF NOT EXISTS merged_at timestamptz;

-- 3) Add origin columns to orders for merge tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS original_table_number int,
  ADD COLUMN IF NOT EXISTS original_session_id uuid;

-- 4) Enable realtime for merged_tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.merged_tables;
