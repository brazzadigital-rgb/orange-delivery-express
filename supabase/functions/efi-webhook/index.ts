import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("EFI Webhook received:", JSON.stringify(body));

    // EFI sends webhook with pix array
    const pixEvents = body.pix || [];

    for (const pixEvent of pixEvents) {
      const txid = pixEvent.txid;
      const valor = pixEvent.valor;
      const horario = pixEvent.horario;
      const endToEndId = pixEvent.endToEndId;

      if (!txid) {
        console.log("PIX event without txid, skipping");
        continue;
      }

      // Find subscription by efi_txid
      const { data: subscription, error: findErr } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("efi_txid", txid)
        .maybeSingle();

      if (findErr || !subscription) {
        console.log(`No subscription found for txid ${txid}`);
        continue;
      }

      // Update subscription as paid
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + (subscription.plan_months || 1));

      const { error: updateErr } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          last_payment_date: horario || new Date().toISOString(),
          last_payment_amount: parseFloat(valor) || subscription.amount_per_cycle,
          next_due_date: nextDue.toISOString().split("T")[0],
          last_mp_status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (updateErr) {
        console.error("Error updating subscription:", updateErr);
        continue;
      }

      // Record payment
      const { error: paymentErr } = await supabase
        .from("subscription_payments")
        .insert({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          store_id: subscription.store_id,
          amount: parseFloat(valor) || subscription.amount_per_cycle,
          status: "approved",
          provider: "efi",
          provider_payment_id: endToEndId || txid,
          paid_at: horario || new Date().toISOString(),
          raw_payload: pixEvent,
        });

      if (paymentErr) {
        console.error("Error recording payment:", paymentErr);
      }

      console.log(`Subscription ${subscription.id} activated via PIX (txid: ${txid})`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("EFI Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
