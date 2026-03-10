
-- Allow store admins to update their own billing_settings
CREATE POLICY "Store admins can update their billing"
  ON public.billing_settings FOR UPDATE
  USING (has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role]))
  WITH CHECK (has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role]));

-- Allow authenticated users to update voucher status to redeemed
CREATE POLICY "Authenticated users can redeem vouchers"
  ON public.vouchers FOR UPDATE
  USING (auth.uid() IS NOT NULL AND status = 'active')
  WITH CHECK (auth.uid() IS NOT NULL AND status = 'redeemed');
