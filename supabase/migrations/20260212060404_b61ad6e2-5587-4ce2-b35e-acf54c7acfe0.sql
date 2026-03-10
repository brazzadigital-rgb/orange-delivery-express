
-- Make user_id nullable for anonymous table orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Update the create_table_order function to use NULL instead of dummy UUID
CREATE OR REPLACE FUNCTION public.create_table_order(p_store_id uuid, p_table_id uuid, p_table_session_id uuid, p_customer_name text DEFAULT NULL::text, p_payment_method text DEFAULT 'cash'::text, p_notes text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_subtotal numeric := 0;
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_tables 
    WHERE id = p_table_id AND store_id = p_store_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Mesa não encontrada ou inativa';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + (v_item->>'item_total')::numeric;
  END LOOP;

  -- Use auth.uid() if available, NULL for anonymous QR users
  v_user_id := auth.uid();

  INSERT INTO orders (
    store_id, user_id, status, delivery_type, 
    table_id, table_session_id, kitchen_status,
    subtotal, delivery_fee, discount, total,
    payment_method, payment_status, notes
  ) VALUES (
    p_store_id,
    v_user_id,
    'created', 'table',
    p_table_id, p_table_session_id, 'received',
    v_subtotal, 0, 0, v_subtotal,
    p_payment_method::payment_method, 'pending', p_notes
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id, product_id, name_snapshot, quantity, base_price, options_snapshot, item_total
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'name_snapshot',
      COALESCE((v_item->>'quantity')::int, 1),
      (v_item->>'base_price')::numeric,
      COALESCE(v_item->'options_snapshot', '[]'::jsonb),
      (v_item->>'item_total')::numeric
    );
  END LOOP;

  INSERT INTO order_events (order_id, status, message)
  VALUES (v_order_id, 'created', 'Pedido de mesa criado');

  RETURN v_order_id;
END;
$function$;
