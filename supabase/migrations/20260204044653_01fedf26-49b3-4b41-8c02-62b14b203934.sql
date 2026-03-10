-- =====================================================
-- VIEWS AGREGADAS PARA DASHBOARD EXECUTIVO
-- =====================================================

-- VIEW: v_orders_enriched
-- Pedidos enriquecidos com dados do cliente, driver e tempos calculados
CREATE OR REPLACE VIEW public.v_orders_enriched AS
SELECT 
  o.id,
  o.order_number,
  o.store_id,
  o.user_id,
  o.status,
  o.delivery_type,
  o.address_snapshot,
  o.subtotal,
  o.delivery_fee,
  o.discount,
  o.total,
  o.payment_method,
  o.payment_status,
  o.notes,
  o.driver_id,
  o.coupon_id,
  o.estimated_minutes,
  o.cancel_reason,
  o.reject_reason,
  o.created_at,
  o.updated_at,
  -- Cliente
  p.name AS customer_name,
  p.phone AS customer_phone,
  p.email AS customer_email,
  -- Driver
  dp.name AS driver_name,
  -- Tempos derivados de order_events
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'accepted' LIMIT 1) AS accepted_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'preparing' LIMIT 1) AS preparing_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'ready' LIMIT 1) AS ready_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'out_for_delivery' LIMIT 1) AS out_for_delivery_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'delivered' LIMIT 1) AS delivered_at,
  -- Cálculos de tempo (em minutos)
  EXTRACT(EPOCH FROM (
    (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'accepted' LIMIT 1) - o.created_at
  )) / 60 AS time_to_accept_min,
  EXTRACT(EPOCH FROM (
    (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'ready' LIMIT 1) - 
    (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'preparing' LIMIT 1)
  )) / 60 AS prep_time_min,
  EXTRACT(EPOCH FROM (
    (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'delivered' LIMIT 1) - 
    (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'out_for_delivery' LIMIT 1)
  )) / 60 AS delivery_time_min,
  EXTRACT(EPOCH FROM (
    (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'delivered' LIMIT 1) - o.created_at
  )) / 60 AS total_cycle_time_min,
  -- Flags
  o.delivery_type = 'delivery' AS is_delivery,
  o.coupon_id IS NOT NULL AS has_coupon
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN profiles dp ON o.driver_id = dp.id;

-- VIEW: v_sales_daily
-- Agregação de vendas por dia
CREATE OR REPLACE VIEW public.v_sales_daily AS
SELECT 
  o.store_id,
  DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') AS date,
  COUNT(*) AS orders_count,
  SUM(o.total) AS gross_revenue,
  SUM(COALESCE(o.discount, 0)) AS discounts_sum,
  SUM(COALESCE(o.delivery_fee, 0)) AS delivery_fee_sum,
  SUM(o.total) - SUM(COALESCE(o.discount, 0)) AS net_revenue,
  AVG(o.total) AS aov,
  COUNT(*) FILTER (WHERE o.payment_status = 'paid')::DECIMAL / NULLIF(COUNT(*), 0) * 100 AS paid_rate,
  COUNT(*) FILTER (WHERE o.status IN ('canceled', 'rejected'))::DECIMAL / NULLIF(COUNT(*), 0) * 100 AS cancel_rate,
  COUNT(*) FILTER (WHERE o.delivery_type = 'delivery')::DECIMAL / NULLIF(COUNT(*), 0) * 100 AS delivery_share,
  COUNT(*) FILTER (WHERE o.delivery_type = 'pickup')::DECIMAL / NULLIF(COUNT(*), 0) * 100 AS pickup_share
FROM orders o
GROUP BY o.store_id, DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo');

-- VIEW: v_sales_hourly
-- Agregação de vendas por hora do dia
CREATE OR REPLACE VIEW public.v_sales_hourly AS
SELECT 
  o.store_id,
  EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Sao_Paulo')::INT AS hour,
  COUNT(*) AS orders_count,
  SUM(o.total) AS gross_revenue,
  AVG(o.total) AS aov
FROM orders o
GROUP BY o.store_id, EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Sao_Paulo');

-- VIEW: v_customer_stats
-- Estatísticas agregadas por cliente
CREATE OR REPLACE VIEW public.v_customer_stats AS
SELECT 
  p.id AS user_id,
  p.name,
  p.phone,
  p.email,
  COALESCE(COUNT(o.id), 0) AS total_orders,
  COALESCE(SUM(o.total), 0) AS total_spent,
  MAX(o.created_at) AS last_order_at,
  COALESCE(AVG(o.total), 0) AS avg_ticket,
  -- Dias desde a última compra
  EXTRACT(DAY FROM NOW() - MAX(o.created_at)) AS days_since_last_order,
  -- Score de risco de churn (simples: baseado em dias + frequência)
  CASE 
    WHEN MAX(o.created_at) IS NULL THEN 100
    WHEN EXTRACT(DAY FROM NOW() - MAX(o.created_at)) > 90 THEN 90
    WHEN EXTRACT(DAY FROM NOW() - MAX(o.created_at)) > 60 THEN 70
    WHEN EXTRACT(DAY FROM NOW() - MAX(o.created_at)) > 30 THEN 50
    ELSE 10
  END AS churn_risk_score
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id AND o.status NOT IN ('canceled', 'rejected')
GROUP BY p.id, p.name, p.phone, p.email;

-- VIEW: v_driver_stats
-- Estatísticas por motoboy
CREATE OR REPLACE VIEW public.v_driver_stats AS
SELECT 
  ur.user_id AS driver_id,
  p.name AS driver_name,
  p.phone AS driver_phone,
  COALESCE(COUNT(o.id) FILTER (WHERE o.status = 'delivered'), 0) AS deliveries_count,
  -- Tempo médio de entrega
  AVG(
    EXTRACT(EPOCH FROM (
      (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'delivered' LIMIT 1) - 
      (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'out_for_delivery' LIMIT 1)
    )) / 60
  ) AS avg_delivery_time_min,
  MAX(o.updated_at) AS last_active_at
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
LEFT JOIN orders o ON o.driver_id = ur.user_id
WHERE ur.role = 'driver'
GROUP BY ur.user_id, p.name, p.phone;

-- VIEW: v_product_performance
-- Performance de produtos
CREATE OR REPLACE VIEW public.v_product_performance AS
SELECT 
  oi.product_id,
  pr.name AS product_name,
  pr.category_id,
  c.name AS category_name,
  COUNT(*) AS qty_sold,
  SUM(oi.item_total) AS revenue_sum,
  AVG(oi.item_total) AS avg_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN products pr ON oi.product_id = pr.id
LEFT JOIN categories c ON pr.category_id = c.id
WHERE o.status NOT IN ('canceled', 'rejected')
GROUP BY oi.product_id, pr.name, pr.category_id, c.name;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id_created_at ON order_events(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);