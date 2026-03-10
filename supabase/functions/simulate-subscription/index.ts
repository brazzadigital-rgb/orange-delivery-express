import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Test-only: simulate subscription events
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const body = await req.json();
    const action = body.action;
    const subscriptionId = body.subscription_id;

    // Get subscription
    let query = supabase.from("subscriptions").select("*");
    if (subscriptionId) {
      query = query.eq("id", subscriptionId);
    } else {
      query = query.eq("user_id", user.id);
    }
    
    const { data: sub } = await query.maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let updates: Record<string, unknown> = { updated_at: now.toISOString() };

    switch (action) {
      case "approve": {
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + (sub.plan_months || 1));
        updates = {
          ...updates,
          status: "active",
          last_mp_status: "authorized",
          last_payment_date: now.toISOString(),
          last_payment_amount: sub.amount_per_cycle,
          next_due_date: nextDue.toISOString().split("T")[0],
        };

        await supabase.from("subscription_payments").insert({
          subscription_id: sub.id,
          user_id: sub.user_id,
          store_id: sub.store_id,
          mp_payment_id: `TEST-PAY-${Date.now()}`,
          amount: sub.amount_per_cycle,
          status: "approved",
          paid_at: now.toISOString(),
          raw_payload: { simulated: true, action: "approve" },
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

    await supabase.from("subscriptions").update(updates).eq("id", sub.id);

    return new Response(
      JSON.stringify({ ok: true, action, subscription_id: sub.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
