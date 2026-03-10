
-- Allow anyone to read table orders (QR code flow - no auth)
CREATE POLICY "Anyone can view table orders"
ON public.orders
FOR SELECT
USING (delivery_type = 'table');

-- Allow anyone to read order items for table orders
CREATE POLICY "Anyone can view table order items"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
  AND orders.delivery_type = 'table'
));
