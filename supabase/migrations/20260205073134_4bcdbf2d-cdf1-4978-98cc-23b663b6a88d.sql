
-- Function to calculate and set pending loyalty points on order creation
CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_order_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings store_loyalty_settings;
  v_points_to_earn INTEGER;
BEGIN
  -- Get loyalty settings for the store
  SELECT * INTO v_settings 
  FROM store_loyalty_settings 
  WHERE store_id = NEW.store_id AND enabled = true;
  
  -- If loyalty is not enabled, skip
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Check if order meets minimum value
  IF NEW.total < v_settings.min_order_to_earn THEN
    NEW.loyalty_points_earned := 0;
    RETURN NEW;
  END IF;
  
  -- Calculate points: floor(total * earning_rate)
  v_points_to_earn := FLOOR(NEW.total * v_settings.earning_rate_points_per_real);
  NEW.loyalty_points_earned := v_points_to_earn;
  
  RETURN NEW;
END;
$$;

-- Function to credit loyalty points when order reaches credit status
CREATE OR REPLACE FUNCTION public.process_loyalty_points_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings store_loyalty_settings;
  v_wallet_id UUID;
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
    -- Ensure we have points to credit
    IF NEW.loyalty_points_earned > 0 THEN
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
  END IF;
  
  -- Handle order cancellation - reverse points if already credited
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.loyalty_earn_processed = true THEN
    -- Deduct points from wallet
    UPDATE loyalty_wallets 
    SET 
      points_balance = GREATEST(0, points_balance - OLD.loyalty_points_earned),
      updated_at = now()
    WHERE store_id = NEW.store_id AND user_id = NEW.user_id;
    
    -- Record reversal transaction
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

-- Create trigger for order creation (BEFORE INSERT to set points_earned)
DROP TRIGGER IF EXISTS tr_loyalty_on_order_create ON orders;
CREATE TRIGGER tr_loyalty_on_order_create
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_loyalty_points_on_order_create();

-- Create trigger for status changes (BEFORE UPDATE to mark processed)
DROP TRIGGER IF EXISTS tr_loyalty_on_order_status_change ON orders;
CREATE TRIGGER tr_loyalty_on_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_loyalty_points_on_status_change();

-- Now let's manually credit points for the order that was already delivered
-- Update the existing delivered orders that haven't been processed
DO $$
DECLARE
  v_order RECORD;
  v_settings store_loyalty_settings;
  v_points INTEGER;
BEGIN
  -- Get settings
  SELECT * INTO v_settings 
  FROM store_loyalty_settings 
  WHERE enabled = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Process unprocessed delivered orders
  FOR v_order IN 
    SELECT * FROM orders 
    WHERE status = 'delivered' 
      AND loyalty_earn_processed = false
      AND total >= v_settings.min_order_to_earn
  LOOP
    -- Calculate points if not set
    v_points := COALESCE(
      NULLIF(v_order.loyalty_points_earned, 0),
      FLOOR(v_order.total * v_settings.earning_rate_points_per_real)
    );
    
    IF v_points > 0 THEN
      -- Update or create wallet
      INSERT INTO loyalty_wallets (store_id, user_id, points_balance, lifetime_earned)
      VALUES (v_order.store_id, v_order.user_id, v_points, v_points)
      ON CONFLICT (store_id, user_id) 
      DO UPDATE SET 
        points_balance = loyalty_wallets.points_balance + v_points,
        lifetime_earned = loyalty_wallets.lifetime_earned + v_points,
        updated_at = now();
      
      -- Record transaction
      INSERT INTO loyalty_transactions (store_id, user_id, order_id, type, points, description)
      VALUES (
        v_order.store_id, 
        v_order.user_id, 
        v_order.id, 
        'earn_posted', 
        v_points,
        'Pontos do pedido #' || v_order.order_number
      );
      
      -- Mark order as processed
      UPDATE orders 
      SET loyalty_earn_processed = true, loyalty_points_earned = v_points
      WHERE id = v_order.id;
    END IF;
  END LOOP;
END;
$$;
