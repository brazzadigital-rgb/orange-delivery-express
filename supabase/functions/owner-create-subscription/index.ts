import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Verify caller is owner or admin
    const { data: storeRole } = await supabase
      .from("store_users")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    const { data: globalRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!storeRole && !globalRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { target_user_id, store_id, plan_code } = body;

    if (!target_user_id || !store_id || !plan_code) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate plan
    const plans: Record<string, { months: number; base: number; discount: number }> = {
      monthly: { months: 1, base: 250, discount: 0 },
      quarterly: { months: 3, base: 250, discount: 10 },
      annual: { months: 12, base: 250, discount: 20 },
    };

    const plan = plans[plan_code];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already has a subscription
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", target_user_id)
      .eq("store_id", store_id)
      .not("status", "in", '("cancelled","suspended")')
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "User already has an active subscription" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = plan.base * plan.months * (1 - plan.discount / 100);
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + plan.months);

    const { data: sub, error: insertErr } = await supabase
      .from("subscriptions")
      .insert({
        user_id: target_user_id,
        store_id,
        plan_code,
        plan_months: plan.months,
        base_monthly_price: plan.base,
        discount_percent: plan.discount,
        amount_per_cycle: amount,
        currency: "BRL",
        status: "active",
        grace_period_days: 2,
        mp_preapproval_id: `OWNER-${Date.now()}`,
        next_due_date: nextDue.toISOString().split("T")[0],
        last_payment_date: new Date().toISOString(),
        last_payment_amount: amount,
        last_mp_status: "authorized",
      })
      .select()
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, subscription: sub }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
