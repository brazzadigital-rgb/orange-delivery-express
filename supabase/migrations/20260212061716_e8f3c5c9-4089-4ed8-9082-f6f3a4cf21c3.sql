
CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings store_loyalty_settings;
BEGIN
  -- Skip loyalty for anonymous orders (no user_id)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only process if status changed and not already processed
  IF OLD.status = NEW.status OR NEW.loyalty_earn_processed = true THEN
    RETURN NEW;
  END IF;
  
  -- Get loyalty settings
  SELECT * INTO v_settings 
  FROM store_loyalty_settings 
  WHERE store_id = NEW.store_id AND enabled = true;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Check if new status matches credit_on_status
  IF NEW.status::text = v_settings.credit_on_status THEN
    IF v_settings.auto_credit_enabled = true AND NEW.loyalty_points_earned > 0 THEN
      INSERT INTO loyalty_wallets (store_id, user_id, points_balance, lifetime_earned)
      VALUES (NEW.store_id, NEW.user_id, NEW.loyalty_points_earned, NEW.loyalty_points_earned)
      ON CONFLICT (store_id, user_id) 
      DO UPDATE SET 
        points_balance = loyalty_wallets.points_balance + NEW.loyalty_points_earned,
        lifetime_earned = loyalty_wallets.lifetime_earned + NEW.loyalty_points_earned,
        updated_at = now();
      
      INSERT INTO loyalty_transactions (store_id, user_id, order_id, type, points, description)
      VALUES (
        NEW.store_id, 
        NEW.user_id, 
        NEW.id, 
        'earn_posted', 
        NEW.loyalty_points_earned,
        'Pontos do pedido #' || NEW.order_number
      );
      
      NEW.loyalty_earn_processed := true;
    END IF;
  END IF;
  
  -- Handle order cancellation - reverse points if already credited
  IF NEW.status IN ('canceled', 'rejected') AND OLD.loyalty_earn_processed = true THEN
    UPDATE loyalty_wallets 
    SET 
      points_balance = GREATEST(0, points_balance - OLD.loyalty_points_earned),
      updated_at = now()
    WHERE store_id = NEW.store_id AND user_id = NEW.user_id;
    
    INSERT INTO loyalty_transactions (store_id, user_id, order_id, type, points, description)
    VALUES (
      NEW.store_id, 
      NEW.user_id, 
      NEW.id, 
      'refund_reversal', 
      -OLD.loyalty_points_earned,
      'Estorno - pedido #' || NEW.order_number || ' cancelado'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Also guard the order creation trigger
CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_order_create()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings store_loyalty_settings;
  v_points_to_earn INTEGER;
  v_reais_per_point NUMERIC;
BEGIN
  -- Skip loyalty for anonymous orders (no user_id)
  IF NEW.user_id IS NULL THEN
    NEW.loyalty_points_earned := 0;
    RETURN NEW;
  END IF;

  SELECT * INTO v_settings 
  FROM store_loyalty_settings 
  WHERE store_id = NEW.store_id AND enabled = true;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  IF NEW.total < v_settings.min_order_to_earn THEN
    NEW.loyalty_points_earned := 0;
    RETURN NEW;
  END IF;
  
  v_reais_per_point := COALESCE(NULLIF(v_settings.reais_per_point, 0), 1);
  v_points_to_earn := FLOOR(NEW.total / v_reais_per_point);
  NEW.loyalty_points_earned := v_points_to_earn;
  
  RETURN NEW;
END;
$function$;
