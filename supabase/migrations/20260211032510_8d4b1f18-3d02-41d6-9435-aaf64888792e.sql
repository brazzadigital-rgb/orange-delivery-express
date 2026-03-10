-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;

-- Create a new policy that allows store owners and admins to manage settings
CREATE POLICY "Store owners and admins can manage store settings"
ON public.store_settings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
);