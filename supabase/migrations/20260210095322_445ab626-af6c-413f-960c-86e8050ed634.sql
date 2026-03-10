
-- Drop the existing policy and recreate with owner support
DROP POLICY IF EXISTS "Super admins can manage plans" ON public.billing_plans;

CREATE POLICY "Admins and owners can manage plans"
  ON public.billing_plans
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );
