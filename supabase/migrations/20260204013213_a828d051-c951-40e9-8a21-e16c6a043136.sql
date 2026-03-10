-- Fix the view to use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.driver_locations_latest;

CREATE VIEW public.driver_locations_latest 
WITH (security_invoker = on) AS
SELECT DISTINCT ON (order_id)
  id, driver_id, order_id, lat, lng, accuracy, heading, speed, recorded_at
FROM public.driver_locations
ORDER BY order_id, recorded_at DESC;