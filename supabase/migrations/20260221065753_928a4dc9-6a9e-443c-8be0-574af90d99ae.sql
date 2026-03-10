
-- pizza_sizes INSERT
CREATE POLICY "Store admins can insert pizza sizes"
ON public.pizza_sizes
FOR INSERT
WITH CHECK (
  public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin']::store_role[])
);

-- pizza_sizes UPDATE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_sizes' AND policyname='Store admins can update pizza sizes') THEN
    EXECUTE 'CREATE POLICY "Store admins can update pizza sizes" ON public.pizza_sizes FOR UPDATE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_sizes DELETE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_sizes' AND policyname='Store admins can delete pizza sizes') THEN
    EXECUTE 'CREATE POLICY "Store admins can delete pizza sizes" ON public.pizza_sizes FOR DELETE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_flavors INSERT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_flavors' AND policyname='Store admins can insert pizza flavors') THEN
    EXECUTE 'CREATE POLICY "Store admins can insert pizza flavors" ON public.pizza_flavors FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_flavors UPDATE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_flavors' AND policyname='Store admins can update pizza flavors') THEN
    EXECUTE 'CREATE POLICY "Store admins can update pizza flavors" ON public.pizza_flavors FOR UPDATE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_flavors DELETE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_flavors' AND policyname='Store admins can delete pizza flavors') THEN
    EXECUTE 'CREATE POLICY "Store admins can delete pizza flavors" ON public.pizza_flavors FOR DELETE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_flavor_prices INSERT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_flavor_prices' AND policyname='Store admins can insert flavor prices') THEN
    EXECUTE 'CREATE POLICY "Store admins can insert flavor prices" ON public.pizza_flavor_prices FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.pizza_sizes s WHERE s.id = size_id AND public.has_store_role(auth.uid(), s.store_id, ARRAY[''owner'',''admin'']::store_role[])))';
  END IF;
END $$;

-- pizza_flavor_prices UPDATE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_flavor_prices' AND policyname='Store admins can update flavor prices') THEN
    EXECUTE 'CREATE POLICY "Store admins can update flavor prices" ON public.pizza_flavor_prices FOR UPDATE USING (EXISTS (SELECT 1 FROM public.pizza_sizes s WHERE s.id = size_id AND public.has_store_role(auth.uid(), s.store_id, ARRAY[''owner'',''admin'']::store_role[])))';
  END IF;
END $$;

-- pizza_flavor_prices DELETE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_flavor_prices' AND policyname='Store admins can delete flavor prices') THEN
    EXECUTE 'CREATE POLICY "Store admins can delete flavor prices" ON public.pizza_flavor_prices FOR DELETE USING (EXISTS (SELECT 1 FROM public.pizza_sizes s WHERE s.id = size_id AND public.has_store_role(auth.uid(), s.store_id, ARRAY[''owner'',''admin'']::store_role[])))';
  END IF;
END $$;

-- pizza_addon_groups INSERT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_addon_groups' AND policyname='Store admins can insert addon groups') THEN
    EXECUTE 'CREATE POLICY "Store admins can insert addon groups" ON public.pizza_addon_groups FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_addon_groups UPDATE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_addon_groups' AND policyname='Store admins can update addon groups') THEN
    EXECUTE 'CREATE POLICY "Store admins can update addon groups" ON public.pizza_addon_groups FOR UPDATE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_addon_groups DELETE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_addon_groups' AND policyname='Store admins can delete addon groups') THEN
    EXECUTE 'CREATE POLICY "Store admins can delete addon groups" ON public.pizza_addon_groups FOR DELETE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_addons INSERT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_addons' AND policyname='Store admins can insert addons') THEN
    EXECUTE 'CREATE POLICY "Store admins can insert addons" ON public.pizza_addons FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_addons UPDATE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_addons' AND policyname='Store admins can update addons') THEN
    EXECUTE 'CREATE POLICY "Store admins can update addons" ON public.pizza_addons FOR UPDATE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

-- pizza_addons DELETE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pizza_addons' AND policyname='Store admins can delete addons') THEN
    EXECUTE 'CREATE POLICY "Store admins can delete addons" ON public.pizza_addons FOR DELETE USING (public.has_store_role(auth.uid(), store_id, ARRAY[''owner'',''admin'']::store_role[]))';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
