import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
  options: Array<{
    priceDelta: number;
  }>;
}

interface CheckoutRequest {
  items: CartItem[];
  addressId?: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'cash';
  couponCode?: string;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate user session
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const body: CheckoutRequest = await req.json();
    
    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Payment method required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get store info
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, is_open, min_order_value, lat, lng')
      .limit(1)
      .single();

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch and validate products
    const productIds = body.items.map(item => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, base_price, active, name')
      .in('id', productIds);

    if (productsError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all products exist and are active
    for (const item of body.items) {
      const product = products?.find(p => p.id === item.productId);
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!product.active) {
        return new Response(
          JSON.stringify({ error: `Product unavailable: ${item.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Recalculate totals server-side (never trust client)
    let subtotal = 0;
    const orderItems = [];

    for (const item of body.items) {
      const product = products?.find(p => p.id === item.productId);
      const optionsTotal = item.options.reduce((sum, opt) => sum + (opt.priceDelta || 0), 0);
      const itemTotal = ((product?.base_price || 0) + optionsTotal) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.productId,
        name_snapshot: item.name,
        quantity: item.quantity,
        base_price: product?.base_price || 0,
        options_snapshot: item.options,
        item_total: itemTotal,
      });
    }

    // Validate minimum order
    if (store.min_order_value && subtotal < store.min_order_value) {
      return new Response(
        JSON.stringify({ 
          error: `Minimum order: R$ ${store.min_order_value.toFixed(2).replace('.', ',')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate delivery fee
    let deliveryFee = 0;
    let addressSnapshot = null;

    if (body.deliveryType === 'delivery' && body.addressId) {
      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', body.addressId)
        .eq('user_id', userId)
        .single();

      if (addressError || !address) {
        return new Response(
          JSON.stringify({ error: 'Address not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      addressSnapshot = {
        id: address.id,
        label: address.label,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip: address.zip,
        lat: address.lat,
        lng: address.lng,
      };

      // Calculate distance if coordinates available
      if (address.lat && address.lng && store.lat && store.lng) {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(Number(address.lat) - Number(store.lat));
        const dLng = toRad(Number(address.lng) - Number(store.lng));
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(Number(store.lat))) * Math.cos(toRad(Number(address.lat))) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Calculate fee: R$5 base + R$1.50/km, min R$5, max R$20
        deliveryFee = Math.min(20, Math.max(5, 5 + distance * 1.5));
        deliveryFee = Math.round(deliveryFee * 100) / 100;
      } else {
        deliveryFee = 8; // Default fee
      }
    }

    // Validate and apply coupon
    let discount = 0;
    let couponId = null;

    if (body.couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', store.id)
        .eq('code', body.couponCode.toUpperCase())
        .eq('active', true)
        .single();

      if (!couponError && coupon) {
        const now = new Date();
        const startsAt = coupon.starts_at ? new Date(coupon.starts_at) : null;
        const endsAt = coupon.ends_at ? new Date(coupon.ends_at) : null;

        if (startsAt && startsAt > now) {
          return new Response(
            JSON.stringify({ error: 'Coupon not yet active' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (endsAt && endsAt < now) {
          return new Response(
            JSON.stringify({ error: 'Coupon expired' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (coupon.min_value && subtotal < coupon.min_value) {
          return new Response(
            JSON.stringify({ 
              error: `Minimum for this coupon: R$ ${coupon.min_value.toFixed(2).replace('.', ',')}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
          return new Response(
            JSON.stringify({ error: 'Coupon usage limit reached' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calculate discount
        if (coupon.type === 'percent') {
          discount = (subtotal * coupon.amount) / 100;
        } else if (coupon.type === 'value') {
          discount = coupon.amount;
        } else if (coupon.type === 'free_delivery') {
          discount = deliveryFee;
        }

        couponId = coupon.id;
      }
    }

    const total = subtotal + deliveryFee - discount;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: store.id,
        user_id: userId,
        status: 'created',
        delivery_type: body.deliveryType,
        address_id: body.addressId || null,
        address_snapshot: addressSnapshot,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        payment_method: body.paymentMethod === 'credit_card' || body.paymentMethod === 'debit_card' ? 'card' : body.paymentMethod,
        payment_status: 'pending',
        notes: body.notes || null,
        coupon_id: couponId,
        estimated_minutes: body.deliveryType === 'pickup' ? 15 : 40,
      } as any)
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Error creating order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
      options_snapshot: JSON.parse(JSON.stringify(item.options_snapshot)),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Error creating order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order event
    await supabase.from('order_events').insert({
      order_id: order.id,
      status: 'created',
      message: 'Pedido criado',
      created_by: userId,
    });

    // Create payment intent
    const provider = body.paymentMethod === 'pix' ? 'pix' : body.paymentMethod === 'cash' ? 'cash' : 'card';
    
    await supabase.from('payment_intents').insert({
      order_id: order.id,
      provider,
      method: body.paymentMethod,
      status: 'pending',
      amount: total,
      currency: 'BRL',
      payload: body.paymentMethod === 'pix' ? {
        qr_code: 'PLACEHOLDER_QR_CODE',
        copy_paste: '00020126580014br.gov.bcb.pix...',
      } : {},
    });

    // Increment coupon usage (non-critical, don't block on failure)
    if (couponId) {
      try {
        const { data: couponData } = await supabase
          .from('coupons')
          .select('used_count')
          .eq('id', couponId)
          .single();
        
        if (couponData) {
          await supabase
            .from('coupons')
            .update({ used_count: (couponData.used_count || 0) + 1 })
            .eq('id', couponId);
        }
      } catch (e) {
        console.error('Failed to increment coupon usage:', e);
      }
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      actor_id: userId,
      actor_role: 'customer',
      action: 'order_created',
      entity_type: 'order',
      entity_id: order.id,
      metadata: { total, items_count: body.items.length },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: {
          id: order.id,
          order_number: order.order_number,
          total,
          status: order.status,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
