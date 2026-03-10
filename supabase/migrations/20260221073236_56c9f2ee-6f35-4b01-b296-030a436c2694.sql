
-- Fix orders UPDATE policy to include store owners/admins
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Store managers can update orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role, 'staff'::store_role])
  );

-- Fix orders SELECT policy to include store owners/admins
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Store managers can view orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role, 'staff'::store_role])
    OR auth.uid() = user_id
    OR auth.uid() = driver_id
    OR delivery_type = 'table'::delivery_type
  );

-- Remove redundant policies now covered by the new one
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view table orders" ON public.orders;

-- Fix notifications INSERT policy to include store owners/admins
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Store managers can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    OR EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.user_id = auth.uid()
      AND store_users.role IN ('owner', 'admin', 'staff')
    )
  );

-- Fix order_events INSERT - check if store managers can insert
DROP POLICY IF EXISTS "Authenticated users can create order events" ON public.order_events;
CREATE POLICY "Authenticated can create order events"
  ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (true);
