-- Corrigir políticas RLS permissivas para ifood_events e order_status_history
-- As inserções/atualizações serão feitas via edge functions com service_role_key

-- Remover políticas permissivas
DROP POLICY IF EXISTS "System can insert iFood events" ON public.ifood_events;
DROP POLICY IF EXISTS "System can update iFood events" ON public.ifood_events;
DROP POLICY IF EXISTS "System can insert order status history" ON public.order_status_history;

-- Criar políticas mais restritivas (admins podem fazer tudo, inserções via service_role não precisam de RLS)
CREATE POLICY "Admins can manage iFood events"
ON public.ifood_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can manage order status history"
ON public.order_status_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Permitir que usuários vejam histórico de seus próprios pedidos
CREATE POLICY "Users can view their order status history"
ON public.order_status_history
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_status_history.order_id 
  AND orders.user_id = auth.uid()
));