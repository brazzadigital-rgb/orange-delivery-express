import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan definitions (must match frontend)
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

    // Auth check
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

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const payerEmail = body.payer_email || user.email;
    const planCode = body.plan_code || "monthly";
    const storeId = body.store_id;

    if (!storeId) {
      return new Response(JSON.stringify({ error: "store_id is required" }), {
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

    // Get billing settings for this store
    const { data: settings } = await supabase
      .from("billing_settings")
      .select("*")
      .eq("store_id", storeId)
      .single();

    const planName = `Plano ${planCode === 'monthly' ? 'Mensal' : planCode === 'quarterly' ? 'Trimestral' : 'Anual'}`;

    const commonUpdates = {
      current_plan_code: planCode,
      current_plan_months: plan.months,
      current_plan_amount: plan.totalPrice,
      current_plan_discount_percent: plan.discountPercent,
      monthly_price: plan.totalPrice,
      plan_name: planName,
      mp_payer_email: payerEmail,
      status: "pending",
      last_mp_status: "pending",
      updated_at: new Date().toISOString(),
    };

    // TEST MODE
    if (!mpAccessToken) {
      const fakePreapprovalId = `TEST-PREAPPROVAL-${Date.now()}`;
      const fakeInitPoint = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${fakePreapprovalId}`;

      await supabase
        .from("billing_settings")
        .update({
          ...commonUpdates,
          mp_preapproval_id: fakePreapprovalId,
          mp_init_point: fakeInitPoint,
        })
        .eq("id", settings!.id);

      return new Response(
        JSON.stringify({
          test_mode: true,
          preapproval_id: fakePreapprovalId,
          init_point: fakeInitPoint,
          plan_code: planCode,
          message: "Modo teste: assinatura simulada criada.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PRODUCTION: create real Mercado Pago preapproval
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;
    
    const mpPayload = {
      reason: planName,
      payer_email: payerEmail,
      back_url: `${appBaseUrl}/admin/subscription`,
      auto_recurring: {
        frequency: plan.months,
        frequency_type: "months",
        transaction_amount: plan.totalPrice,
        currency_id: "BRL",
      },
      external_reference: `app_subscription_${planCode}`,
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
        JSON.stringify({ error: "Erro ao criar assinatura no Mercado Pago", details: mpData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("billing_settings")
      .update({
        ...commonUpdates,
        mp_preapproval_id: mpData.id,
        mp_init_point: mpData.init_point,
        last_mp_status: mpData.status,
      })
      .eq("id", settings!.id);

    return new Response(
      JSON.stringify({
        test_mode: false,
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
