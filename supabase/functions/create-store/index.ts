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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name, slug, phone, address, store_type } = body as {
      name: string;
      slug: string;
      phone?: string;
      address?: string;
      store_type?: string;
    };

    if (!name || !slug) {
      return new Response(JSON.stringify({ error: "Nome e slug são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      return new Response(JSON.stringify({ error: "Slug inválido. Use apenas letras minúsculas, números e hífens (3-32 caracteres)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate store_type
    const validTypes = ['pizzaria', 'hamburgueria', 'bebidas', 'sushi', 'acai', 'padaria', 'restaurante', 'generico'];
    const resolvedType = store_type && validTypes.includes(store_type) ? store_type : 'generico';

    const admin = createClient(supabaseUrl, serviceKey);

    // Check if slug is already taken
    const { data: existing } = await admin
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Este slug já está em uso. Escolha outro." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create the store
    const { data: store, error: storeError } = await admin
      .from("stores")
      .insert({
        name,
        slug,
        phone: phone || null,
        address_text: address || null,
        owner_email: user.email,
        status: "active",
        plan: "pro",
        created_by: user.id,
        store_type: resolvedType,
      })
      .select("id, slug")
      .single();

    if (storeError) {
      console.error("Store creation error:", storeError);
      return new Response(JSON.stringify({ error: "Erro ao criar loja: " + storeError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storeId = store.id;

    // 2. Create store_users (owner)
    await admin.from("store_users").insert({
      store_id: storeId,
      user_id: user.id,
      role: "owner",
      accepted_at: new Date().toISOString(),
    });

    // 3. Create store_settings
    await admin.from("store_settings").insert({
      store_id: storeId,
      store_name: name,
      store_phone: phone || null,
      store_address: address || null,
    });

    // 4. Create app_settings
    await admin.from("app_settings").insert({
      store_id: storeId,
      app_name: name,
      app_short_name: name.substring(0, 12),
    });

    // 5. Create billing_settings (active with 7-day trial)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    await admin.from("billing_settings").insert({
      store_id: storeId,
      status: "trial",
      plan_name: "Trial",
      monthly_price: 0,
      current_plan_code: "free",
      current_plan_months: 0,
      current_plan_amount: 0,
      current_plan_discount_percent: 0,
      next_due_date: trialEnd.toISOString().split("T")[0],
      grace_period_days: 7,
    });

    // 6. Create default store subscription with trial
    const { data: defaultPlan } = await admin
      .from("billing_plans")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();

    if (defaultPlan) {
      await admin.from("store_subscriptions").insert({
        store_id: storeId,
        plan_id: defaultPlan.id,
        status: "trialing",
        billing_cycle: "monthly",
        trial_ends_at: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      });
    }

    // Note: home sections are auto-initialized by the DB trigger (trg_auto_init_home_sections)

    return new Response(
      JSON.stringify({
        success: true,
        store_id: storeId,
        slug: store.slug,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
