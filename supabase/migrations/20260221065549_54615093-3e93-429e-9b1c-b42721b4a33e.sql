
-- Add INSERT policy for store_pizza_settings
CREATE POLICY "Store admins can insert pizza settings"
ON public.store_pizza_settings
FOR INSERT
WITH CHECK (
  public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin']::store_role[])
);

-- Ensure UPDATE policy exists too
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'store_pizza_settings' 
    AND policyname = 'Store admins can update pizza settings'
  ) THEN
    EXECUTE 'CREATE POLICY "Store admins can update pizza settings" ON public.store_pizza_settings FOR UPDATE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
