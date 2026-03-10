-- Fix overly permissive RLS policy - restrict to service role only
DROP POLICY IF EXISTS "System can insert push logs" ON public.push_delivery_logs;

-- Create a more restrictive policy that allows inserts from authenticated users
-- but only for their own user_id (for debug page tests)
CREATE POLICY "Users can insert their own push logs"
ON public.push_delivery_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also allow admins to insert logs (for system operations)
CREATE POLICY "Admins can insert push logs"
ON public.push_delivery_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));