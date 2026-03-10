-- Corrigir security das views para usar SECURITY INVOKER
-- Isso faz com que as views respeitem as políticas RLS do usuário que consulta

-- Recriar views com security_invoker=on
DROP VIEW IF EXISTS public.v_orders_enriched;
DROP VIEW IF EXISTS public.v_sales_daily;
DROP VIEW IF EXISTS public.v_sales_hourly;
DROP VIEW IF EXISTS public.v_customer_stats;
DROP VIEW IF EXISTS public.v_driver_stats;
DROP VIEW IF EXISTS public.v_product_performance;

-- VIEW: v_orders_enriched
CREATE VIEW public.v_orders_enriched
WITH (security_invoker=on) AS
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
  p.name AS customer_name,
  p.phone AS customer_phone,
  p.email AS customer_email,
  dp.name AS driver_name,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'accepted' LIMIT 1) AS accepted_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'preparing' LIMIT 1) AS preparing_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'ready' LIMIT 1) AS ready_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'out_for_delivery' LIMIT 1) AS out_for_delivery_at,
  (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'delivered' LIMIT 1) AS delivered_at,
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
  o.delivery_type = 'delivery' AS is_delivery,
  o.coupon_id IS NOT NULL AS has_coupon
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN profiles dp ON o.driver_id = dp.id;

-- VIEW: v_sales_daily
CREATE VIEW public.v_sales_daily
WITH (security_invoker=on) AS
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
CREATE VIEW public.v_sales_hourly
WITH (security_invoker=on) AS
SELECT 
  o.store_id,
  EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Sao_Paulo')::INT AS hour,
  COUNT(*) AS orders_count,
  SUM(o.total) AS gross_revenue,
  AVG(o.total) AS aov
FROM orders o
GROUP BY o.store_id, EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Sao_Paulo');

-- VIEW: v_customer_stats
CREATE VIEW public.v_customer_stats
WITH (security_invoker=on) AS
SELECT 
  p.id AS user_id,
  p.name,
  p.phone,
  p.email,
  COALESCE(COUNT(o.id), 0) AS total_orders,
  COALESCE(SUM(o.total), 0) AS total_spent,
  MAX(o.created_at) AS last_order_at,
  COALESCE(AVG(o.total), 0) AS avg_ticket,
  EXTRACT(DAY FROM NOW() - MAX(o.created_at)) AS days_since_last_order,
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
CREATE VIEW public.v_driver_stats
WITH (security_invoker=on) AS
SELECT 
  ur.user_id AS driver_id,
  p.name AS driver_name,
  p.phone AS driver_phone,
  COALESCE(COUNT(o.id) FILTER (WHERE o.status = 'delivered'), 0) AS deliveries_count,
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
CREATE VIEW public.v_product_performance
WITH (security_invoker=on) AS
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