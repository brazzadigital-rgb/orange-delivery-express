-- Allow store owners to view all profiles
CREATE POLICY "Store owners can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.store_users
    WHERE store_users.user_id = auth.uid()
    AND store_users.role = 'owner'
  )
);