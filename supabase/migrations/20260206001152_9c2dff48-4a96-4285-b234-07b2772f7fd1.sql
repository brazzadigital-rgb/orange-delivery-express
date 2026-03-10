-- Update the function to use reais_per_point instead of earning_rate_points_per_real
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
  
  -- Use reais_per_point if set (new field), otherwise fallback to earning_rate_points_per_real
  v_reais_per_point := COALESCE(NULLIF(v_settings.reais_per_point, 0), 1);
  
  -- Calculate points: floor(total / reais_per_point)
  -- Example: total=50, reais_per_point=5 => 10 points
  v_points_to_earn := FLOOR(NEW.total / v_reais_per_point);
  NEW.loyalty_points_earned := v_points_to_earn;
  
  RETURN NEW;
END;
$function$;