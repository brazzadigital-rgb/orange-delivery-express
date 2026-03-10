
-- 1. Update v_orders_enriched to include table customer name as fallback
DROP VIEW IF EXISTS v_orders_enriched;

CREATE VIEW v_orders_enriched WITH (security_invoker = on) AS
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
  o.channel,
  o.table_session_id,
  o.table_id,
  COALESCE(p.name, ts.customer_name, 'Cliente Mesa') AS customer_name,
  COALESCE(p.phone, ts.customer_phone) AS customer_phone,
  p.email AS customer_email,
  dp.name AS driver_name,
  (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'accepted' LIMIT 1) AS accepted_at,
  (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'preparing' LIMIT 1) AS preparing_at,
  (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'ready' LIMIT 1) AS ready_at,
  (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'out_for_delivery' LIMIT 1) AS out_for_delivery_at,
  (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'delivered' LIMIT 1) AS delivered_at,
  EXTRACT(epoch FROM (
    (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'accepted' LIMIT 1) - o.created_at
  )) / 60 AS time_to_accept_min,
  EXTRACT(epoch FROM (
    (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'ready' LIMIT 1) -
    (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'preparing' LIMIT 1)
  )) / 60 AS prep_time_min,
  EXTRACT(epoch FROM (
    (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'delivered' LIMIT 1) -
    (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'out_for_delivery' LIMIT 1)
  )) / 60 AS delivery_time_min,
  EXTRACT(epoch FROM (
    (SELECT oe.created_at FROM order_events oe WHERE oe.order_id = o.id AND oe.status = 'delivered' LIMIT 1) - o.created_at
  )) / 60 AS total_cycle_time_min,
  (o.delivery_type = 'delivery') AS is_delivery,
  (o.coupon_id IS NOT NULL) AS has_coupon
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN profiles dp ON o.driver_id = dp.id
LEFT JOIN table_sessions ts ON o.table_session_id = ts.id;

-- 2. Update v_sales_daily to include table_share
DROP VIEW IF EXISTS v_sales_daily;

CREATE VIEW v_sales_daily WITH (security_invoker = on) AS
SELECT 
  store_id,
  date(created_at AT TIME ZONE 'America/Sao_Paulo') AS date,
  count(*) AS orders_count,
  sum(total) AS gross_revenue,
  sum(COALESCE(discount, 0::numeric)) AS discounts_sum,
  sum(COALESCE(delivery_fee, 0::numeric)) AS delivery_fee_sum,
  sum(total) - sum(COALESCE(discount, 0::numeric)) AS net_revenue,
  avg(total) AS aov,
  (count(*) FILTER (WHERE payment_status = 'paid')::numeric / NULLIF(count(*), 0)::numeric * 100) AS paid_rate,
  (count(*) FILTER (WHERE status IN ('canceled', 'rejected'))::numeric / NULLIF(count(*), 0)::numeric * 100) AS cancel_rate,
  (count(*) FILTER (WHERE delivery_type = 'delivery')::numeric / NULLIF(count(*), 0)::numeric * 100) AS delivery_share,
  (count(*) FILTER (WHERE delivery_type = 'pickup')::numeric / NULLIF(count(*), 0)::numeric * 100) AS pickup_share,
  (count(*) FILTER (WHERE delivery_type = 'table')::numeric / NULLIF(count(*), 0)::numeric * 100) AS table_share
FROM orders o
GROUP BY store_id, date(created_at AT TIME ZONE 'America/Sao_Paulo');

-- 3. Update v_sales_hourly (no changes needed, already includes all orders)

-- 4. Update v_product_performance to include items without product_id (pizza builder)
DROP VIEW IF EXISTS v_product_performance;

CREATE VIEW v_product_performance WITH (security_invoker = on) AS
SELECT 
  COALESCE(oi.product_id, oi.id) AS product_id,
  COALESCE(pr.name, oi.name_snapshot) AS product_name,
  COALESCE(pr.category_id, '00000000-0000-0000-0000-000000000000') AS category_id,
  COALESCE(c.name, 'Pizza Personalizada') AS category_name,
  count(*) AS qty_sold,
  sum(oi.item_total) AS revenue_sum,
  avg(oi.item_total) AS avg_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN products pr ON oi.product_id = pr.id
LEFT JOIN categories c ON pr.category_id = c.id
WHERE o.status NOT IN ('canceled', 'rejected')
GROUP BY COALESCE(oi.product_id, oi.id), COALESCE(pr.name, oi.name_snapshot), COALESCE(pr.category_id, '00000000-0000-0000-0000-000000000000'), COALESCE(c.name, 'Pizza Personalizada');

-- 5. Update v_customer_stats to include table session customers
DROP VIEW IF EXISTS v_customer_stats;

CREATE VIEW v_customer_stats WITH (security_invoker = on) AS
-- Registered users
SELECT 
  p.id AS user_id,
  p.name,
  p.phone,
  p.email,
  COALESCE(count(o.id), 0) AS total_orders,
  COALESCE(sum(o.total), 0) AS total_spent,
  max(o.created_at) AS last_order_at,
  COALESCE(avg(o.total), 0) AS avg_ticket,
  EXTRACT(day FROM (now() - max(o.created_at))) AS days_since_last_order,
  CASE
    WHEN max(o.created_at) IS NULL THEN 100
    WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 90 THEN 90
    WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 60 THEN 70
    WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 30 THEN 50
    ELSE 10
  END AS churn_risk_score
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id AND o.status NOT IN ('canceled', 'rejected')
GROUP BY p.id, p.name, p.phone, p.email

UNION ALL

-- Table session customers (anonymous, no user_id)
SELECT 
  ts.id AS user_id,
  ts.customer_name AS name,
  ts.customer_phone AS phone,
  NULL AS email,
  count(o.id) AS total_orders,
  COALESCE(sum(o.total), 0) AS total_spent,
  max(o.created_at) AS last_order_at,
  COALESCE(avg(o.total), 0) AS avg_ticket,
  EXTRACT(day FROM (now() - max(o.created_at))) AS days_since_last_order,
  CASE
    WHEN max(o.created_at) IS NULL THEN 100
    WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 90 THEN 90
    WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 60 THEN 70
    WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 30 THEN 50
    ELSE 10
  END AS churn_risk_score
FROM table_sessions ts
JOIN orders o ON o.table_session_id = ts.id AND o.user_id IS NULL AND o.status NOT IN ('canceled', 'rejected')
WHERE ts.customer_name IS NOT NULL
GROUP BY ts.id, ts.customer_name, ts.customer_phone;
