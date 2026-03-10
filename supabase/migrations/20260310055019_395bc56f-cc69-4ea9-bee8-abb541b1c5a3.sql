
-- Missing functions, triggers, and views from original migrations

-- 1. Loyalty trigger functions
CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_order_create()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_settings store_loyalty_settings; v_points_to_earn INTEGER; v_reais_per_point NUMERIC;
BEGIN
  IF NEW.user_id IS NULL THEN NEW.loyalty_points_earned := 0; RETURN NEW; END IF;
  SELECT * INTO v_settings FROM store_loyalty_settings WHERE store_id = NEW.store_id AND enabled = true;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF NEW.total < v_settings.min_order_to_earn THEN NEW.loyalty_points_earned := 0; RETURN NEW; END IF;
  v_reais_per_point := COALESCE(NULLIF(v_settings.reais_per_point, 0), 1);
  v_points_to_earn := FLOOR(NEW.total / v_reais_per_point);
  NEW.loyalty_points_earned := v_points_to_earn;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_settings store_loyalty_settings;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status OR NEW.loyalty_earn_processed = true THEN RETURN NEW; END IF;
  SELECT * INTO v_settings FROM store_loyalty_settings WHERE store_id = NEW.store_id AND enabled = true;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF NEW.status::text = v_settings.credit_on_status THEN
    IF v_settings.auto_credit_enabled = true AND NEW.loyalty_points_earned > 0 THEN
      INSERT INTO loyalty_wallets (store_id, user_id, points_balance, lifetime_earned)
      VALUES (NEW.store_id, NEW.user_id, NEW.loyalty_points_earned, NEW.loyalty_points_earned)
      ON CONFLICT (store_id, user_id) DO UPDATE SET points_balance = loyalty_wallets.points_balance + NEW.loyalty_points_earned, lifetime_earned = loyalty_wallets.lifetime_earned + NEW.loyalty_points_earned, updated_at = now();
      INSERT INTO loyalty_transactions (store_id, user_id, order_id, type, points, description)
      VALUES (NEW.store_id, NEW.user_id, NEW.id, 'earn_posted', NEW.loyalty_points_earned, 'Pontos do pedido #' || NEW.order_number);
      NEW.loyalty_earn_processed := true;
    END IF;
  END IF;
  IF NEW.status IN ('canceled', 'rejected') AND OLD.loyalty_earn_processed = true THEN
    UPDATE loyalty_wallets SET points_balance = GREATEST(0, points_balance - OLD.loyalty_points_earned), updated_at = now() WHERE store_id = NEW.store_id AND user_id = NEW.user_id;
    INSERT INTO loyalty_transactions (store_id, user_id, order_id, type, points, description)
    VALUES (NEW.store_id, NEW.user_id, NEW.id, 'refund_reversal', -OLD.loyalty_points_earned, 'Estorno - pedido #' || NEW.order_number || ' cancelado');
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Loyalty triggers
DROP TRIGGER IF EXISTS tr_loyalty_on_order_create ON orders;
CREATE TRIGGER tr_loyalty_on_order_create BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION process_loyalty_points_on_order_create();
DROP TRIGGER IF EXISTS tr_loyalty_on_order_status_change ON orders;
CREATE TRIGGER tr_loyalty_on_order_status_change BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION process_loyalty_points_on_status_change();

-- 3. Session token revocation
CREATE OR REPLACE FUNCTION public.revoke_session_tokens_on_close()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status = 'open' THEN
    UPDATE public.table_session_tokens SET status = 'revoked', revoked_at = now() WHERE table_session_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_revoke_tokens_on_session_close ON public.table_sessions;
CREATE TRIGGER trg_revoke_tokens_on_session_close AFTER UPDATE ON public.table_sessions FOR EACH ROW EXECUTE FUNCTION public.revoke_session_tokens_on_close();

-- 4. Home sections initialization
CREATE OR REPLACE FUNCTION public.initialize_store_home_sections(p_store_id UUID, p_store_type text DEFAULT 'generico')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM store_home_sections WHERE store_id = p_store_id;
  INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
    (p_store_id, 'banners', 'Banners / Carrossel', 1, true),
    (p_store_id, 'categories', 'Categorias', 3, true),
    (p_store_id, 'products', 'Produtos', 4, true),
    (p_store_id, 'promotions', 'Promoções', 5, true),
    (p_store_id, 'featured', 'Destaques', 2, true),
    (p_store_id, 'loyalty', 'Programa de Fidelidade', 7, true);
  IF p_store_type = 'pizzaria' THEN
    INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
      (p_store_id, 'pizza_builder_cta', 'Monte sua Pizza (CTA)', 2, true),
      (p_store_id, 'pizza_sizes', 'Tamanhos de Pizza', 6, true);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_init_home_sections()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM initialize_store_home_sections(NEW.id, COALESCE(NEW.store_type, 'generico'));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_auto_init_home_sections ON public.stores;
CREATE TRIGGER trg_auto_init_home_sections AFTER INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.auto_init_home_sections();

-- 5. User subscription gate
CREATE OR REPLACE FUNCTION public.get_user_subscription_gate(p_user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_sub subscriptions; v_grace interval;
BEGIN
  IF has_role(p_user_id, 'admin'::app_role) THEN RETURN 'open'; END IF;
  IF EXISTS (SELECT 1 FROM store_users WHERE user_id = p_user_id AND role IN ('owner','admin')) THEN RETURN 'open'; END IF;
  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_user_id LIMIT 1;
  IF NOT FOUND THEN RETURN 'open'; END IF;
  IF v_sub.status = 'active' THEN
    IF v_sub.next_due_date IS NOT NULL THEN
      v_grace := (v_sub.grace_period_days || ' days')::interval;
      IF now()::date > v_sub.next_due_date + v_grace THEN RETURN 'blocked';
      ELSIF now()::date > v_sub.next_due_date THEN RETURN 'past_due'; END IF;
    END IF;
    RETURN 'open';
  END IF;
  IF v_sub.status = 'past_due' THEN RETURN 'past_due'; END IF;
  RETURN 'blocked';
END;
$$;

-- 6. Store current usage
CREATE OR REPLACE FUNCTION public.get_store_current_usage(p_store_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_orders integer; v_products integer; v_categories integer; v_users integer; v_drivers integer;
BEGIN
  SELECT COUNT(*) INTO v_orders FROM orders WHERE store_id = p_store_id AND created_at >= date_trunc('month', now());
  SELECT COUNT(*) INTO v_products FROM products WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_categories FROM categories WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_users FROM store_users WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_drivers FROM store_users WHERE store_id = p_store_id AND role = 'driver'::store_role;
  RETURN jsonb_build_object('orders_this_month', v_orders, 'products_count', v_products, 'categories_count', v_categories, 'users_count', v_users, 'drivers_count', v_drivers);
END;
$$;

-- 7. Missing views
DROP VIEW IF EXISTS v_customer_stats;
CREATE VIEW v_customer_stats WITH (security_invoker = on) AS
SELECT p.id AS user_id, p.name, p.phone, p.email,
  COALESCE(count(o.id), 0) AS total_orders, COALESCE(sum(o.total), 0) AS total_spent,
  max(o.created_at) AS last_order_at, COALESCE(avg(o.total), 0) AS avg_ticket,
  EXTRACT(day FROM (now() - max(o.created_at))) AS days_since_last_order,
  CASE WHEN max(o.created_at) IS NULL THEN 100 WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 90 THEN 90 WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 60 THEN 70 WHEN EXTRACT(day FROM (now() - max(o.created_at))) > 30 THEN 50 ELSE 10 END AS churn_risk_score
FROM profiles p LEFT JOIN orders o ON o.user_id = p.id AND o.status NOT IN ('canceled', 'rejected')
GROUP BY p.id, p.name, p.phone, p.email;

DROP VIEW IF EXISTS v_driver_stats;
CREATE VIEW v_driver_stats WITH (security_invoker = on) AS
SELECT ur.user_id AS driver_id, p.name AS driver_name, p.phone AS driver_phone,
  COALESCE(COUNT(o.id) FILTER (WHERE o.status = 'delivered'), 0) AS deliveries_count,
  AVG(EXTRACT(EPOCH FROM ((SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'delivered' LIMIT 1) - (SELECT created_at FROM order_events WHERE order_id = o.id AND status = 'out_for_delivery' LIMIT 1))) / 60) AS avg_delivery_time_min,
  MAX(o.updated_at) AS last_active_at
FROM user_roles ur JOIN profiles p ON ur.user_id = p.id LEFT JOIN orders o ON o.driver_id = ur.user_id
WHERE ur.role = 'driver' GROUP BY ur.user_id, p.name, p.phone;

DROP VIEW IF EXISTS v_product_performance;
CREATE VIEW v_product_performance WITH (security_invoker = on) AS
SELECT COALESCE(oi.product_id, oi.id) AS product_id, COALESCE(pr.name, oi.name_snapshot) AS product_name,
  COALESCE(pr.category_id, '00000000-0000-0000-0000-000000000000') AS category_id,
  COALESCE(c.name, 'Pizza Personalizada') AS category_name,
  count(*) AS qty_sold, sum(oi.item_total) AS revenue_sum, avg(oi.item_total) AS avg_price
FROM order_items oi JOIN orders o ON oi.order_id = o.id LEFT JOIN products pr ON oi.product_id = pr.id LEFT JOIN categories c ON pr.category_id = c.id
WHERE o.status NOT IN ('canceled', 'rejected')
GROUP BY COALESCE(oi.product_id, oi.id), COALESCE(pr.name, oi.name_snapshot), COALESCE(pr.category_id, '00000000-0000-0000-0000-000000000000'), COALESCE(c.name, 'Pizza Personalizada');

-- 8. Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_session_tokens;
