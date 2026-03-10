import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Log raw event
    await supabase.from("billing_events").insert({
      mp_event_id: body.id?.toString() || null,
      topic: body.topic || body.type || null,
      mp_resource_id: body.data?.id?.toString() || null,
      raw_payload: body,
    });

    const topic = body.topic || body.type;
    const resourceId = body.data?.id?.toString();

    if (!resourceId) {
      return new Response(JSON.stringify({ ok: true, message: "No resource ID" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TEST MODE
    if (!mpAccessToken) {
      return new Response(JSON.stringify({ ok: true, test_mode: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // PRODUCTION: verify with MP API
    if (topic === "preapproval" || topic === "subscription_preapproval") {
      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });
      const preapproval = await mpRes.json();

      let newStatus = "pending";
      if (preapproval.status === "authorized") newStatus = "active";
      else if (preapproval.status === "paused") newStatus = "past_due";
      else if (preapproval.status === "cancelled") newStatus = "suspended";

      await supabase
        .from("billing_settings")
        .update({
          status: newStatus,
          last_mp_status: preapproval.status,
          updated_at: new Date().toISOString(),
        })
        .eq("mp_preapproval_id", preapproval.id);
    }

    if (topic === "payment") {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });
      const payment = await mpRes.json();

      // Save payment record
      await supabase.from("billing_payments").upsert(
        {
          mp_payment_id: payment.id?.toString(),
          mp_preapproval_id: payment.metadata?.preapproval_id || null,
          amount: payment.transaction_amount,
          status: payment.status,
          paid_at: payment.status === "approved" ? payment.date_approved : null,
          raw_payload: payment,
        },
        { onConflict: "mp_payment_id" }
      );

      if (payment.status === "approved") {
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() + 30);

        await supabase
          .from("billing_settings")
          .update({
            status: "active",
            last_payment_date: payment.date_approved,
            last_payment_amount: payment.transaction_amount,
            next_due_date: nextDue.toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .limit(1);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
