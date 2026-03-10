-- Create carts table for persistent cart storage
CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
  coupon_code text,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_snapshot text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  base_price numeric NOT NULL,
  options_snapshot jsonb DEFAULT '[]'::jsonb,
  item_total numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payment_intents table
CREATE TABLE public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'manual' CHECK (provider IN ('pix', 'card', 'cash', 'manual')),
  method text NOT NULL CHECK (method IN ('pix', 'credit_card', 'debit_card', 'cash')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'requires_action', 'paid', 'failed', 'expired', 'refunded')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  payload jsonb DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create audit_logs table for admin actions
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Carts RLS policies
CREATE POLICY "Users can view their own carts"
ON public.carts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own carts"
ON public.carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own carts"
ON public.carts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own carts"
ON public.carts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all carts"
ON public.carts FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Cart items RLS policies
CREATE POLICY "Users can view their own cart items"
ON public.cart_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.carts
  WHERE carts.id = cart_items.cart_id
  AND carts.user_id = auth.uid()
));

CREATE POLICY "Users can create cart items for their carts"
ON public.cart_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.carts
  WHERE carts.id = cart_items.cart_id
  AND carts.user_id = auth.uid()
));

CREATE POLICY "Users can update their own cart items"
ON public.cart_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.carts
  WHERE carts.id = cart_items.cart_id
  AND carts.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own cart items"
ON public.cart_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.carts
  WHERE carts.id = cart_items.cart_id
  AND carts.user_id = auth.uid()
));

CREATE POLICY "Admins can view all cart items"
ON public.cart_items FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Payment intents RLS policies
CREATE POLICY "Users can view their own payment intents"
ON public.payment_intents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = payment_intents.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create payment intents for their orders"
ON public.payment_intents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = payment_intents.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can update their own payment intents"
ON public.payment_intents FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = payment_intents.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all payment intents"
ON public.payment_intents FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Audit logs RLS policies
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_carts_status ON public.carts(status);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_payment_intents_order_id ON public.payment_intents(order_id);
CREATE INDEX idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);