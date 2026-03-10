-- Allow store owners to read user_roles for admin management
CREATE POLICY "Store owners can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.store_users
    WHERE store_users.user_id = auth.uid()
    AND store_users.role = 'owner'
  )
);

-- Allow store owners to manage roles (insert/update/delete)
CREATE POLICY "Store owners can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.store_users
    WHERE store_users.user_id = auth.uid()
    AND store_users.role = 'owner'
  )
);