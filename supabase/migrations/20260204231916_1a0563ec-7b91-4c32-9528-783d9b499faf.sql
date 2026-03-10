-- Add RLS policy for customers to insert order events for their own orders
CREATE POLICY "Customers can create events for their orders"
ON public.order_events
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_events.order_id
  AND orders.user_id = auth.uid()
));