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
    const subscriptionId = body.subscription_id;

    // Get the subscription — either by ID (owner) or by user_id (self)
    let query = supabase.from("subscriptions").select("*");
    if (subscriptionId) {
      query = query.eq("id", subscriptionId);
    } else {
      query = query.eq("user_id", user.id);
    }
    
    const { data: sub, error: subErr } = await query.maybeSingle();
    if (subErr || !sub) {
      return new Response(JSON.stringify({ error: "Subscription not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If owner accessing another user's subscription, verify store access
    if (sub.user_id !== user.id) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      const isAdmin = roleData?.role === "admin";
      
      if (!isAdmin) {
        const { data: storeRole } = await supabase
          .from("store_users")
          .select("role")
          .eq("user_id", user.id)
          .eq("store_id", sub.store_id)
          .single();
        
        if (!storeRole || !["owner", "admin"].includes(storeRole.role)) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

    // TEST MODE
    if (!mpAccessToken || sub.mp_preapproval_id?.startsWith("TEST-")) {
      return new Response(
        JSON.stringify({ test_mode: true, status: sub.status, message: "Modo teste — use simulação" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PRODUCTION: fetch from MP
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_preapproval_id}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!mpRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to sync with MP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpRes.json();

    const updates: Record<string, unknown> = {
      last_mp_status: mpData.status,
      updated_at: new Date().toISOString(),
    };

    if (mpData.status === "authorized") {
      updates.status = "active";
    } else if (mpData.status === "paused") {
      updates.status = "past_due";
    } else if (mpData.status === "cancelled") {
      updates.status = "suspended";
    }

    await supabase.from("subscriptions").update(updates).eq("id", sub.id);

    return new Response(
      JSON.stringify({ test_mode: false, synced: true, mp_status: mpData.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
