import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS: Record<string, { months: number; totalPrice: number; discountPercent: number }> = {
  monthly: { months: 1, totalPrice: 250, discountPercent: 0 },
  quarterly: { months: 3, totalPrice: 675, discountPercent: 10 },
  annual: { months: 12, totalPrice: 2400, discountPercent: 20 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const appBaseUrl = Deno.env.get("APP_BASE_URL") || supabaseUrl.replace(".supabase.co", "");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const planCode = body.plan_code || "monthly";
    const storeId = body.store_id;

    if (!storeId) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = PLANS[planCode];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid plan_code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planName = planCode === 'monthly' ? 'Mensal' : planCode === 'quarterly' ? 'Trimestral' : 'Anual';

    // Upsert subscription
    const subData = {
      user_id: user.id,
      store_id: storeId,
      plan_code: planCode,
      plan_months: plan.months,
      base_monthly_price: 250,
      discount_percent: plan.discountPercent,
      amount_per_cycle: plan.totalPrice,
      status: "pending",
      last_mp_status: "pending",
      mp_payer_email: user.email,
      updated_at: new Date().toISOString(),
    };

    // TEST MODE
    if (!mpAccessToken) {
      const fakeId = `TEST-SUB-${Date.now()}`;
      const fakeInitPoint = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${fakeId}`;

      const { data: sub, error: upsertErr } = await supabase
        .from("subscriptions")
        .upsert({
          ...subData,
          mp_preapproval_id: fakeId,
          mp_init_point: fakeInitPoint,
        }, { onConflict: "user_id,store_id" })
        .select()
        .single();

      if (upsertErr) {
        return new Response(JSON.stringify({ error: upsertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          test_mode: true,
          subscription_id: sub.id,
          preapproval_id: fakeId,
          init_point: fakeInitPoint,
          plan_code: planCode,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PRODUCTION
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    const mpPayload = {
      reason: `Plano ${planName}`,
      payer_email: user.email,
      back_url: `${appBaseUrl}/subscription`,
      auto_recurring: {
        frequency: plan.months,
        frequency_type: "months",
        transaction_amount: plan.totalPrice,
        currency_id: "BRL",
      },
      external_reference: `sub_${user.id}_${storeId}`,
      status: "pending",
      notification_url: webhookUrl,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ error: "MP error", details: mpData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: sub, error: upsertErr } = await supabase
      .from("subscriptions")
      .upsert({
        ...subData,
        mp_preapproval_id: mpData.id,
        mp_init_point: mpData.init_point,
        last_mp_status: mpData.status,
      }, { onConflict: "user_id,store_id" })
      .select()
      .single();

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        test_mode: false,
        subscription_id: sub.id,
        preapproval_id: mpData.id,
        init_point: mpData.init_point,
        plan_code: planCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
