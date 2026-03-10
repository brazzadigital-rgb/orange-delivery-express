
-- Fix: Allow global 'owner' role to view all store_subscriptions (same as admin)
DROP POLICY IF EXISTS "Super admins can manage subscriptions" ON public.store_subscriptions;

CREATE POLICY "Super admins and owners can manage subscriptions"
ON public.store_subscriptions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Also fix billing_settings RLS for the same issue
DROP POLICY IF EXISTS "Admins can manage billing" ON public.billing_settings;
DROP POLICY IF EXISTS "Super admins can manage billing_settings" ON public.billing_settings;

CREATE POLICY "Super admins and owners can manage billing_settings"
ON public.billing_settings
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);
