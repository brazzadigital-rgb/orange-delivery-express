import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Test-only endpoint to simulate payment events
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    const action = body.action;
    const storeId = body.store_id;

    if (!storeId) {
      return new Response(JSON.stringify({ error: "store_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await supabase
      .from("billing_settings")
      .select("*")
      .eq("store_id", storeId)
      .single();

    if (!settings) {
      return new Response(JSON.stringify({ error: "No billing settings" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const planMonths = settings.current_plan_months || 1;
    const planAmount = settings.current_plan_amount || settings.monthly_price || 250;
    let updates: Record<string, unknown> = { updated_at: now.toISOString() };

    switch (action) {
      case "approve": {
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + planMonths);
        updates = {
          ...updates,
          status: "active",
          last_mp_status: "authorized",
          last_payment_date: now.toISOString(),
          last_payment_amount: planAmount,
          next_due_date: nextDue.toISOString().split("T")[0],
        };

        // Record simulated payment
        await supabase.from("billing_payments").insert({
          mp_payment_id: `TEST-PAY-${Date.now()}`,
          mp_preapproval_id: settings.mp_preapproval_id,
          amount: planAmount,
          status: "approved",
          paid_at: now.toISOString(),
          raw_payload: { simulated: true, action: "approve", plan_months: planMonths },
        });
        break;
      }
      case "pause":
        updates = { ...updates, status: "past_due", last_mp_status: "paused" };
        break;
      case "cancel":
        updates = { ...updates, status: "suspended", last_mp_status: "cancelled" };
        break;
      case "expire": {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);
        updates = {
          ...updates,
          status: "active",
          last_mp_status: "authorized",
          next_due_date: pastDate.toISOString().split("T")[0],
        };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    await supabase.from("billing_settings").update(updates).eq("id", settings.id);

    return new Response(
      JSON.stringify({ ok: true, action, new_status: updates.status || settings.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
