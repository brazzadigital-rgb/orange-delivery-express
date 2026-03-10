-- =============================================
-- INTEGRAÇÃO iFOOD - TABELAS E ALTERAÇÕES
-- =============================================

-- 1) Tabela de conexões iFood (credenciais e tokens)
CREATE TABLE public.ifood_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'POLLING' CHECK (mode IN ('POLLING', 'WEBHOOK')),
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  last_poll_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_store_ifood_connection UNIQUE (store_id)
);

-- 2) Tabela de merchants iFood vinculados
CREATE TABLE public.ifood_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.ifood_connections(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL,
  name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_merchant_per_connection UNIQUE (connection_id, merchant_id)
);

-- 3) Tabela de eventos iFood (para idempotência e auditoria)
CREATE TABLE public.ifood_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.ifood_connections(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  code TEXT NOT NULL,
  full_code TEXT,
  order_id TEXT,
  merchant_id TEXT,
  created_at_event TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_ifood_event UNIQUE (event_id)
);

-- 4) Tabela de histórico de status de pedidos
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'internal' CHECK (source IN ('internal', 'ifood')),
  from_status TEXT,
  to_status TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Adicionar colunas na tabela orders para suporte multicanal
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'internal' CHECK (channel IN ('internal', 'ifood'));

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS external_order_id TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS merchant_id_ifood TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- 6) Índices para performance
CREATE INDEX idx_ifood_events_processed ON public.ifood_events(processed) WHERE processed = false;
CREATE INDEX idx_ifood_events_order_id ON public.ifood_events(order_id);
CREATE INDEX idx_ifood_events_created_at ON public.ifood_events(created_at_event);
CREATE INDEX idx_orders_channel ON public.orders(channel);
CREATE INDEX idx_orders_external_order_id ON public.orders(external_order_id);
CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id);

-- 7) Trigger para updated_at em ifood_connections
CREATE TRIGGER update_ifood_connections_updated_at
BEFORE UPDATE ON public.ifood_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8) RLS para ifood_connections (somente admins)
ALTER TABLE public.ifood_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage iFood connections"
ON public.ifood_connections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9) RLS para ifood_merchants (somente admins)
ALTER TABLE public.ifood_merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage iFood merchants"
ON public.ifood_merchants
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 10) RLS para ifood_events (somente admins/staff)
ALTER TABLE public.ifood_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view iFood events"
ON public.ifood_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "System can insert iFood events"
ON public.ifood_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update iFood events"
ON public.ifood_events
FOR UPDATE
USING (true);

-- 11) RLS para order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view order status history"
ON public.order_status_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "System can insert order status history"
ON public.order_status_history
FOR INSERT
WITH CHECK (true);

-- 12) Habilitar realtime para ifood_events e orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.ifood_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;