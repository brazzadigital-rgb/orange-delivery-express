
-- Update get_billing_gate to use store_subscriptions as primary SSOT
-- Falls back to billing_settings for backward compatibility
CREATE OR REPLACE FUNCTION public.get_billing_gate(p_store_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sub store_subscriptions;
  v_plan billing_plans;
  v_settings billing_settings;
  v_grace interval;
BEGIN
  -- 1. Try store_subscriptions first (new SSOT)
  SELECT * INTO v_sub 
  FROM store_subscriptions 
  WHERE store_id = p_store_id 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF FOUND THEN
    -- Trialing: check if trial expired
    IF v_sub.status = 'trialing' THEN
      IF v_sub.trial_ends_at IS NOT NULL AND now() > v_sub.trial_ends_at THEN
        -- Lazy enforcement: auto-suspend expired trial
        UPDATE store_subscriptions 
        SET status = 'expired', updated_at = now() 
        WHERE id = v_sub.id AND status = 'trialing';
        RETURN 'blocked';
      END IF;
      RETURN 'open';
    END IF;

    -- Cancelled / expired
    IF v_sub.status IN ('canceled', 'expired') THEN
      RETURN 'blocked';
    END IF;

    -- Active: check period end
    IF v_sub.status = 'active' THEN
      IF v_sub.current_period_end IS NOT NULL THEN
        -- Use 2-day grace by default
        v_grace := '2 days'::interval;
        IF now() > v_sub.current_period_end + v_grace THEN
          RETURN 'blocked';
        ELSIF now() > v_sub.current_period_end THEN
          RETURN 'past_due';
        END IF;
      END IF;
      RETURN 'open';
    END IF;

    IF v_sub.status = 'past_due' THEN
      RETURN 'past_due';
    END IF;

    -- Unknown status
    RETURN 'blocked';
  END IF;

  -- 2. Fallback: check billing_settings (legacy)
  SELECT * INTO v_settings FROM billing_settings WHERE store_id = p_store_id;
  
  IF NOT FOUND THEN
    RETURN 'blocked';
  END IF;
  
  IF v_settings.status = 'trial' THEN
    IF v_settings.next_due_date IS NOT NULL AND now()::date > v_settings.next_due_date THEN
      UPDATE billing_settings 
      SET status = 'suspended', updated_at = now() 
      WHERE store_id = p_store_id AND status = 'trial';
      RETURN 'blocked';
    END IF;
    RETURN 'open';
  END IF;
  
  IF v_settings.status IN ('suspended', 'cancelled', 'pending') THEN
    RETURN 'blocked';
  END IF;
  
  IF v_settings.status = 'active' THEN
    IF v_settings.next_due_date IS NOT NULL THEN
      v_grace := (v_settings.grace_period_days || ' days')::interval;
      IF now()::date > v_settings.next_due_date + v_grace THEN
        RETURN 'blocked';
      ELSIF now()::date > v_settings.next_due_date THEN
        RETURN 'past_due';
      END IF;
    END IF;
    RETURN 'open';
  END IF;
  
  IF v_settings.status = 'past_due' THEN
    RETURN 'past_due';
  END IF;
  
  RETURN 'blocked';
END;
$function$;

-- Also create a helper to get the store's active plan with entitlements
CREATE OR REPLACE FUNCTION public.get_store_plan_entitlements(p_store_id uuid)
RETURNS TABLE(
  plan_slug text,
  plan_name text,
  max_products integer,
  max_categories integer,
  max_orders_per_month integer,
  max_users integer,
  max_drivers integer,
  has_analytics boolean,
  has_api_access boolean,
  has_custom_domain boolean,
  has_priority_support boolean,
  subscription_status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  billing_cycle text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    bp.slug,
    bp.name,
    bp.max_products,
    bp.max_categories,
    bp.max_orders_per_month,
    bp.max_users,
    bp.max_drivers,
    COALESCE(bp.has_analytics, false),
    COALESCE(bp.has_api_access, false),
    COALESCE(bp.has_custom_domain, false),
    COALESCE(bp.has_priority_support, false),
    ss.status,
    ss.trial_ends_at,
    ss.current_period_end,
    ss.billing_cycle
  FROM store_subscriptions ss
  JOIN billing_plans bp ON bp.id = ss.plan_id
  WHERE ss.store_id = p_store_id
    AND ss.status IN ('active', 'trialing', 'past_due')
  ORDER BY ss.created_at DESC
  LIMIT 1;
$$;
