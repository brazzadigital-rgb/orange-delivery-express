
-- Drop old function and recreate with correct param name
DROP FUNCTION IF EXISTS public.create_table_order(uuid,uuid,uuid,jsonb,text);
DROP FUNCTION IF EXISTS public.create_table_order(uuid,uuid,jsonb,text);

CREATE OR REPLACE FUNCTION public.create_table_order(
  p_store_id uuid,
  p_table_session_id uuid,
  p_table_id uuid,
  p_items jsonb,
  p_notes text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id uuid;
  v_subtotal numeric := 0;
BEGIN
  SELECT COALESCE(SUM((el->>'item_total')::numeric), 0) INTO v_subtotal FROM jsonb_array_elements(p_items) AS el;

  INSERT INTO orders (store_id, subtotal, total, delivery_type, channel, notes, status)
  VALUES (p_store_id, v_subtotal, v_subtotal, 'table'::delivery_type, 'table', p_notes, 'created'::order_status)
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, name_snapshot, quantity, base_price, item_total, options_snapshot)
  SELECT v_order_id, (el->>'product_id')::uuid, el->>'name_snapshot', COALESCE((el->>'quantity')::integer,1), (el->>'base_price')::numeric, (el->>'item_total')::numeric, COALESCE(el->'options_snapshot','[]'::jsonb)
  FROM jsonb_array_elements(p_items) AS el;

  INSERT INTO table_session_items (session_id, product_id, name_snapshot, quantity, unit_price, item_total, status)
  SELECT p_table_session_id, (el->>'product_id')::uuid, el->>'name_snapshot', COALESCE((el->>'quantity')::integer,1), (el->>'base_price')::numeric, (el->>'item_total')::numeric, 'confirmed'
  FROM jsonb_array_elements(p_items) AS el;

  UPDATE table_sessions SET total = total + v_subtotal WHERE id = p_table_session_id;
  RETURN v_order_id::text;
END;
$$;

-- Add missing columns for remaining errors
ALTER TABLE public.store_subscriptions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
