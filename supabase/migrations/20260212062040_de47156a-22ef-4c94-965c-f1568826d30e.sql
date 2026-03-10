
-- Allow anonymous users to update customer_name and customer_phone on open sessions
CREATE POLICY "Anon can update customer info on open sessions"
ON public.table_sessions
FOR UPDATE
USING (status = 'open')
WITH CHECK (status = 'open');
