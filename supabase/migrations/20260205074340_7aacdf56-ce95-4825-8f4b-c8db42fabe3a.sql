-- Fix the trigger function to use correct enum value 'canceled' instead of 'cancelled'
CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings store_loyalty_settings;
BEGIN
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
    -- Only auto-credit if auto_credit_enabled is true
    IF v_settings.auto_credit_enabled = true AND NEW.loyalty_points_earned > 0 THEN
      -- Create or update wallet
      INSERT INTO loyalty_wallets (store_id, user_id, points_balance, lifetime_earned)
      VALUES (NEW.store_id, NEW.user_id, NEW.loyalty_points_earned, NEW.loyalty_points_earned)
      ON CONFLICT (store_id, user_id) 
      DO UPDATE SET 
        points_balance = loyalty_wallets.points_balance + NEW.loyalty_points_earned,
        lifetime_earned = loyalty_wallets.lifetime_earned + NEW.loyalty_points_earned,
        updated_at = now();
      
      -- Record the transaction
      INSERT INTO loyalty_transactions (store_id, user_id, order_id, type, points, description)
      VALUES (
        NEW.store_id, 
        NEW.user_id, 
        NEW.id, 
        'earn_posted', 
        NEW.loyalty_points_earned,
        'Pontos do pedido #' || NEW.order_number
      );
      
      -- Mark as processed
      NEW.loyalty_earn_processed := true;
    END IF;
    -- If auto_credit is disabled, points stay as pending (loyalty_earn_processed = false)
  END IF;
  
  -- Handle order cancellation - reverse points if already credited
  -- FIXED: Use 'canceled' (one 'l') to match the order_status enum
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