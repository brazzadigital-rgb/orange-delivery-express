CREATE OR REPLACE FUNCTION public.get_billing_gate(p_store_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings RECORD;
BEGIN
  SELECT * INTO v_settings FROM billing_settings WHERE store_id = p_store_id;
  IF NOT FOUND THEN RETURN '{"allowed":true,"plan":"free"}'::jsonb; END IF;
  
  -- Check trial status with expiry
  IF v_settings.status IN ('trial', 'trialing') THEN
    IF v_settings.next_due_date IS NOT NULL AND now() > v_settings.next_due_date::timestamptz THEN
      RETURN jsonb_build_object('allowed', false, 'plan', v_settings.plan_name, 'status', 'expired');
    END IF;
    RETURN jsonb_build_object('allowed', true, 'plan', v_settings.plan_name, 'status', v_settings.status);
  END IF;
  
  -- Check active with grace period
  IF v_settings.status = 'active' THEN
    IF v_settings.next_due_date IS NOT NULL THEN
      IF now() > (v_settings.next_due_date::timestamptz + (COALESCE(v_settings.grace_period_days, 2) || ' days')::interval) THEN
        RETURN jsonb_build_object('allowed', false, 'plan', v_settings.plan_name, 'status', 'blocked');
      ELSIF now() > v_settings.next_due_date::timestamptz THEN
        RETURN jsonb_build_object('allowed', true, 'plan', v_settings.plan_name, 'status', 'past_due');
      END IF;
    END IF;
    RETURN jsonb_build_object('allowed', true, 'plan', v_settings.plan_name, 'status', 'active');
  END IF;
  
  -- Suspended/cancelled
  IF v_settings.status IN ('suspended', 'cancelled', 'pending') THEN
    RETURN jsonb_build_object('allowed', false, 'plan', v_settings.plan_name, 'status', v_settings.status);
  END IF;
  
  RETURN jsonb_build_object('allowed', false, 'plan', COALESCE(v_settings.plan_name, 'free'), 'status', COALESCE(v_settings.status, 'pending'));
END;
$function$;