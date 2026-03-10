import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // TEST MODE: Handle test webhook events
    if (!stripeKey) {
      const body = await req.json();
      console.log("[TEST MODE] Received webhook:", body);

      if (body.type === "test.payment.success" && body.orderId) {
        // Simulate successful payment
        await handlePaymentSuccess(supabase, body.orderId);
        
        return new Response(
          JSON.stringify({ received: true, testMode: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          received: true, 
          testMode: true,
          message: "Webhook em modo de teste" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PRODUCTION MODE: Verify Stripe signature
    const signature = req.headers.get("stripe-signature");
    if (!signature || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Missing signature or webhook secret" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const Stripe = (await import("https://esm.sh/stripe@14.14.0?target=deno")).default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe event received:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          await handlePaymentSuccess(supabase, orderId, session);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          await handlePaymentExpired(supabase, orderId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        // Find order by payment intent
        const { data: payment } = await supabase
          .from("payment_intents")
          .select("order_id")
          .eq("payload->session_id", paymentIntent.id)
          .single();

        if (payment?.order_id) {
          await handlePaymentFailed(supabase, payment.order_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handlePaymentSuccess(
  supabase: any, 
  orderId: string, 
  session?: any
) {
  console.log("Processing successful payment for order:", orderId);

  // Idempotency guard: prevent duplicate events/notifications for the same order
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("payment_status, user_id, order_number")
    .eq("id", orderId)
    .single();

  if (!existingOrder) return;

  // If already paid, do not create duplicates.
  // Ensure the user has at least one notification, then stop.
  if (existingOrder.payment_status === "paid") {
    const { data: existingNotification } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", existingOrder.user_id)
      .eq("title", "Pagamento Confirmado! 🎉")
      .eq("data->>order_id", orderId)
      .limit(1);

    if (!existingNotification || existingNotification.length === 0) {
      await supabase
        .from("notifications")
        .insert({
          user_id: existingOrder.user_id,
          type: "order",
          title: "Pagamento Confirmado! 🎉",
          body: `Seu pedido #${existingOrder.order_number} foi pago com sucesso. Estamos preparando!`,
          data: { order_id: orderId },
        });
    }

    return;
  }

  // Update order status to paid
  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // Create order event
  const { data: existingPaidEvent } = await supabase
    .from("order_events")
    .select("id")
    .eq("order_id", orderId)
    .eq("status", "paid")
    .limit(1);

  if (!existingPaidEvent || existingPaidEvent.length === 0) {
    await supabase
      .from("order_events")
      .insert({
        order_id: orderId,
        status: "paid",
        message: "Pagamento confirmado via Stripe",
      });
  }

  // Update payment intent if exists
  if (session) {
    await supabase
      .from("payment_intents")
      .update({
        status: "paid",
        payload: { 
          session_id: session.id,
          payment_intent: session.payment_intent,
          amount_received: session.amount_total,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);
  }

  // Create notification for user (only once per order)
  const { data: existingNotification } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", existingOrder.user_id)
    .eq("title", "Pagamento Confirmado! 🎉")
    .eq("data->>order_id", orderId)
    .limit(1);

  if (!existingNotification || existingNotification.length === 0) {
    await supabase
      .from("notifications")
      .insert({
        user_id: existingOrder.user_id,
        type: "order",
        title: "Pagamento Confirmado! 🎉",
        body: `Seu pedido #${existingOrder.order_number} foi pago com sucesso. Estamos preparando!`,
        data: { order_id: orderId },
      });
  }
}

async function handlePaymentExpired(supabase: any, orderId: string) {
  console.log("Payment session expired for order:", orderId);

  await supabase
    .from("payment_intents")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);
}

async function handlePaymentFailed(supabase: any, orderId: string) {
  console.log("Payment failed for order:", orderId);

  await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  await supabase
    .from("payment_intents")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);

  // Get order for notification
  const { data: order } = await supabase
    .from("orders")
    .select("user_id, order_number")
    .eq("id", orderId)
    .single();

  if (order) {
    await supabase
      .from("notifications")
      .insert({
        user_id: order.user_id,
        type: "order",
        title: "Pagamento não aprovado",
        body: `O pagamento do pedido #${order.order_number} não foi aprovado. Tente novamente.`,
        data: { order_id: orderId },
      });
  }
}
