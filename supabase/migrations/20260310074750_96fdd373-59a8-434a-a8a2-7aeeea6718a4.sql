-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins manage billing" ON billing_settings;
DROP POLICY IF EXISTS "Owner/admins view billing" ON billing_settings;

-- Allow store owners/admins (from store_users) to view their store's billing
CREATE POLICY "Store staff view billing"
ON billing_settings
FOR SELECT
TO authenticated
USING (
  has_store_role(auth.uid(), store_id, ARRAY['owner', 'admin']::store_role[])
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow store owners (from store_users) and global admins to manage billing
CREATE POLICY "Store owners manage billing"
ON billing_settings
FOR ALL
TO authenticated
USING (
  has_store_role(auth.uid(), store_id, ARRAY['owner']::store_role[])
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_store_role(auth.uid(), store_id, ARRAY['owner']::store_role[])
  OR has_role(auth.uid(), 'admin'::app_role)
);