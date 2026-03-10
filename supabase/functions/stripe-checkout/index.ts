import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Stripe will be dynamically imported only when API key is available
let stripe: any = null;

function appendQuery(url: string, query: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${query}`;
}

async function getStripe() {
  if (stripe) return stripe;
  
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return null;
  }
  
  const Stripe = (await import("https://esm.sh/stripe@14.14.0?target=deno")).default;
  stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
  
  return stripe;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeClient = await getStripe();
    
    // Check if in test mode (no Stripe key configured)
    const isTestMode = !stripeClient;
    
    const { orderId, paymentMethod, successUrl, cancelUrl } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TEST MODE: Return mock session
    if (isTestMode) {
      console.log("[TEST MODE] Creating mock Stripe session for order:", orderId);
      
      const mockSessionId = `test_session_${Date.now()}`;

      // Ensure order params exist (successUrl may already contain them)
      let baseSuccessUrl = successUrl;
      if (!baseSuccessUrl.includes("order_id=")) {
        baseSuccessUrl = appendQuery(baseSuccessUrl, `order_id=${encodeURIComponent(orderId)}`);
      }
      if (!baseSuccessUrl.includes("order_number=")) {
        baseSuccessUrl = appendQuery(baseSuccessUrl, `order_number=${encodeURIComponent(String(order.order_number))}`);
      }

      // Append test params without breaking existing querystring
      const mockCheckoutUrl = appendQuery(
        baseSuccessUrl,
        `session_id=${encodeURIComponent(mockSessionId)}&test_mode=true`
      );
      
      // Update order with test payment info
      await supabase
        .from("orders")
        .update({
          payment_method: paymentMethod === "pix" ? "pix" : "card",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      return new Response(
        JSON.stringify({
          sessionId: mockSessionId,
          url: mockCheckoutUrl,
          testMode: true,
          message: "Stripe em modo de teste. Configure STRIPE_SECRET_KEY para pagamentos reais.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PRODUCTION MODE: Create real Stripe session
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.name_snapshot,
          description: item.options_snapshot 
            ? JSON.stringify(item.options_snapshot) 
            : undefined,
        },
        unit_amount: Math.round(item.base_price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery fee if applicable
    if (order.delivery_fee && order.delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: "Taxa de Entrega",
          },
          unit_amount: Math.round(order.delivery_fee * 100),
        },
        quantity: 1,
      });
    }

    // Determine payment methods based on user selection
    const paymentMethodTypes: string[] = [];
    if (paymentMethod === "pix") {
      paymentMethodTypes.push("pix");
    } else {
      paymentMethodTypes.push("card");
    }

    // Create Stripe Checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: lineItems,
      mode: "payment",
      // successUrl can already include query params (e.g. order_id/order_number)
      success_url: appendQuery(successUrl, "session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: cancelUrl,
      metadata: {
        order_id: orderId,
        user_id: userId,
      },
      // Apply discount if any
      ...(order.discount && order.discount > 0 ? {
        discounts: [{
          coupon: await createStripeCoupon(stripeClient, order.discount),
        }],
      } : {}),
    });

    // Store payment intent reference
    await supabase
      .from("payment_intents")
      .insert({
        order_id: orderId,
        provider: "stripe",
        method: paymentMethod,
        amount: order.total,
        status: "pending",
        payload: { session_id: session.id },
      });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        testMode: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createStripeCoupon(stripeClient: any, discountAmount: number): Promise<string> {
  const coupon = await stripeClient.coupons.create({
    amount_off: Math.round(discountAmount * 100),
    currency: "brl",
    duration: "once",
  });
  return coupon.id;
}
