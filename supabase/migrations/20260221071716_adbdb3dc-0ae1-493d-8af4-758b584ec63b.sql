-- Update categories: allow store owners/admins to manage their store's categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Store admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  );

-- Update products: allow store owners/admins to manage their store's products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Store admins can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  );