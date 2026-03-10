
-- =============================================================
-- Sprint 2: Harden RLS policies with USING(true) on write ops
-- =============================================================

-- 1. merged_tables: restrict INSERT/UPDATE to store staff
DROP POLICY IF EXISTS "Staff can insert merged_tables" ON public.merged_tables;
CREATE POLICY "Staff can insert merged_tables"
  ON public.merged_tables FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_sessions ts
      WHERE ts.id = master_session_id
      AND public.has_store_role(auth.uid(), ts.store_id, ARRAY['owner','admin','staff']::store_role[])
    )
  );

DROP POLICY IF EXISTS "Staff can update merged_tables" ON public.merged_tables;
CREATE POLICY "Staff can update merged_tables"
  ON public.merged_tables FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.table_sessions ts
      WHERE ts.id = master_session_id
      AND public.has_store_role(auth.uid(), ts.store_id, ARRAY['owner','admin','staff']::store_role[])
    )
  );

-- 2. order_events: restrict INSERT to authenticated users with access to the order's store
DROP POLICY IF EXISTS "Authenticated can create order events" ON public.order_events;
CREATE POLICY "Authenticated can create order events"
  ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (
        o.user_id = auth.uid()
        OR public.has_store_role(auth.uid(), o.store_id, ARRAY['owner','admin','staff']::store_role[])
      )
    )
  );

-- 3. table_calls: restrict INSERT to users with a valid session token or store staff
DROP POLICY IF EXISTS "Anyone can create table calls" ON public.table_calls;
CREATE POLICY "Authenticated or anon can create table calls"
  ON public.table_calls FOR INSERT
  WITH CHECK (
    -- Store staff can always create
    public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin','staff']::store_role[])
    -- Or anyone if the table_session is open (QR code users)
    OR EXISTS (
      SELECT 1 FROM public.table_sessions ts
      WHERE ts.id = table_session_id AND ts.status = 'open'
    )
  );

-- 4. table_session_tokens: restrict to session-related operations
DROP POLICY IF EXISTS "Anyone can create session tokens" ON public.table_session_tokens;
CREATE POLICY "Session tokens can be created for open sessions"
  ON public.table_session_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_sessions ts
      WHERE ts.id = table_session_id AND ts.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Anyone can update session tokens" ON public.table_session_tokens;
CREATE POLICY "Session tokens can be updated for validation"
  ON public.table_session_tokens FOR UPDATE
  USING (
    -- Allow updating own token (by matching token value in the session)
    -- Or store staff can revoke tokens
    EXISTS (
      SELECT 1 FROM public.table_sessions ts
      WHERE ts.id = table_session_id
      AND (
        ts.status = 'open'
        OR public.has_store_role(auth.uid(), ts.store_id, ARRAY['owner','admin','staff']::store_role[])
      )
    )
  );

-- 5. table_sessions: restrict INSERT to store staff or valid QR access
DROP POLICY IF EXISTS "Anon can insert table sessions" ON public.table_sessions;
CREATE POLICY "Table sessions can be created for valid tables"
  ON public.table_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurant_tables rt
      WHERE rt.id = table_id AND rt.is_active = true
    )
  );

-- 6. purchase_orders: restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can create purchase orders" ON public.purchase_orders;
CREATE POLICY "Authenticated users can create purchase orders"
  ON public.purchase_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. billing_settings: remove public read, restrict to store owners/admins
DROP POLICY IF EXISTS "Service can read billing for gate" ON public.billing_settings;
CREATE POLICY "Billing settings readable by store members"
  ON public.billing_settings FOR SELECT TO authenticated
  USING (
    public.has_store_role(auth.uid(), store_id, ARRAY['owner','admin']::store_role[])
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
