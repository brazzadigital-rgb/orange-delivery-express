
-- Update get_billing_gate to handle trial status with lazy enforcement
-- When status='trial' and now > next_due_date, auto-suspend
CREATE OR REPLACE FUNCTION public.get_billing_gate(p_store_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings billing_settings;
  v_grace interval;
BEGIN
  SELECT * INTO v_settings FROM billing_settings WHERE store_id = p_store_id;
  
  IF NOT FOUND THEN
    RETURN 'blocked';
  END IF;
  
  -- Handle trial: if trial expired, auto-suspend
  IF v_settings.status = 'trial' THEN
    IF v_settings.next_due_date IS NOT NULL AND now()::date > v_settings.next_due_date THEN
      -- Lazy enforcement: auto-suspend expired trial
      UPDATE billing_settings 
      SET status = 'suspended', updated_at = now() 
      WHERE store_id = p_store_id AND status = 'trial';
      RETURN 'blocked';
    END IF;
    -- Trial still valid
    RETURN 'open';
  END IF;
  
  -- Handle suspended/cancelled
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
