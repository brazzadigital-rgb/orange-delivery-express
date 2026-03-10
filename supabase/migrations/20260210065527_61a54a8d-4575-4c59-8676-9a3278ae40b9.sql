-- Update the super admin policy on store_users to also allow owner role
DROP POLICY IF EXISTS "Super admins can manage store_users" ON public.store_users;

CREATE POLICY "Super admins can manage store_users"
ON public.store_users
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);
