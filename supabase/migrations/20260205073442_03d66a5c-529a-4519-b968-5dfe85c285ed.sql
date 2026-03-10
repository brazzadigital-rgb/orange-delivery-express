
-- Add auto_credit_enabled column to store_loyalty_settings
ALTER TABLE store_loyalty_settings 
ADD COLUMN IF NOT EXISTS auto_credit_enabled boolean NOT NULL DEFAULT true;

-- Update the trigger function to respect auto_credit setting
CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.loyalty_earn_processed = true THEN
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
$$;

-- Function for admin to manually approve/credit pending points
CREATE OR REPLACE FUNCTION public.approve_loyalty_points(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
BEGIN
  -- Get the order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if already processed
  IF v_order.loyalty_earn_processed = true THEN
    RETURN false;
  END IF;
  
  -- Check if there are points to credit
  IF v_order.loyalty_points_earned <= 0 THEN
    RETURN false;
  END IF;
  
  -- Credit the points
  INSERT INTO loyalty_wallets (store_id, user_id, points_balance, lifetime_earned)
  VALUES (v_order.store_id, v_order.user_id, v_order.loyalty_points_earned, v_order.loyalty_points_earned)
  ON CONFLICT (store_id, user_id) 
  DO UPDATE SET 
    points_balance = loyalty_wallets.points_balance + v_order.loyalty_points_earned,
    lifetime_earned = loyalty_wallets.lifetime_earned + v_order.loyalty_points_earned,
    updated_at = now();
  
  -- Record transaction
  INSERT INTO loyalty_transactions (store_id, user_id, order_id, type, points, description)
  VALUES (
    v_order.store_id, 
    v_order.user_id, 
    v_order.id, 
    'earn_posted', 
    v_order.loyalty_points_earned,
    'Pontos aprovados manualmente - pedido #' || v_order.order_number
  );
  
  -- Mark as processed
  UPDATE orders SET loyalty_earn_processed = true WHERE id = p_order_id;
  
  RETURN true;
END;
$$;
