import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const storeId = body.store_id;

    if (!storeId) {
      return new Response(JSON.stringify({ error: "store_id is required" }), {
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

    if (!settings?.mp_preapproval_id) {
      return new Response(
        JSON.stringify({ error: "Nenhuma assinatura encontrada", synced: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TEST MODE: simulate sync
    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({
          test_mode: true,
          synced: true,
          status: settings.status,
          message: "Modo teste: status mantido. Use 'Simular Pagamento' para testar.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PRODUCTION: query MP API
    const mpRes = await fetch(
      `https://api.mercadopago.com/preapproval/${settings.mp_preapproval_id}`,
      { headers: { Authorization: `Bearer ${mpAccessToken}` } }
    );
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
      .eq("id", settings.id);

    return new Response(
      JSON.stringify({
        test_mode: false,
        synced: true,
        status: newStatus,
        mp_status: preapproval.status,
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
