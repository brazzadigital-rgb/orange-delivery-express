-- =============================================
-- SISTEMA DE IMPRESSÃO DE PEDIDOS
-- =============================================

-- 1) Tabela de configurações de impressão por loja
CREATE TABLE public.store_print_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  printer_enabled boolean NOT NULL DEFAULT true,
  paper_size text NOT NULL DEFAULT '80mm' CHECK (paper_size IN ('80mm', '58mm')),
  auto_print_new_orders boolean NOT NULL DEFAULT false,
  auto_print_copies integer NOT NULL DEFAULT 1,
  print_on_status text NOT NULL DEFAULT 'accepted' CHECK (print_on_status IN ('created', 'accepted')),
  print_templates_enabled jsonb NOT NULL DEFAULT '{"kitchen": true, "counter": true, "delivery": true}'::jsonb,
  header_logo_url text,
  footer_message text,
  show_prices_on_kitchen boolean NOT NULL DEFAULT false,
  show_qr_pickup boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- 2) Tabela de jobs de impressão (controle de duplicidade)
CREATE TABLE public.order_print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  template text NOT NULL CHECK (template IN ('kitchen', 'counter', 'delivery')),
  copies integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'printed', 'failed')),
  is_reprint boolean NOT NULL DEFAULT false,
  printed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_order_print_jobs_order_id ON public.order_print_jobs(order_id);
CREATE INDEX idx_order_print_jobs_store_status ON public.order_print_jobs(store_id, status);
CREATE INDEX idx_order_print_jobs_order_template ON public.order_print_jobs(order_id, template, status);

-- Enable RLS
ALTER TABLE public.store_print_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_print_jobs ENABLE ROW LEVEL SECURITY;

-- Policies para store_print_settings
CREATE POLICY "Admins can manage print settings"
  ON public.store_print_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view print settings"
  ON public.store_print_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Policies para order_print_jobs
CREATE POLICY "Admins can manage print jobs"
  ON public.order_print_jobs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_store_print_settings_updated_at
  BEFORE UPDATE ON public.store_print_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para print jobs (auto-print)
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_print_jobs;