import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EFI_API_BASE = "https://pix.api.efipay.com.br";

function parsePemFromBase64(p12Base64: string): { cert: string; key: string } {
  const cleaned = p12Base64.replace(/[\s\r\n\uFEFF]/g, '');
  const decoded = atob(cleaned);
  const trimmed = decoded.replace(/^\uFEFF/, '').trim();

  const certMatch = trimmed.match(
    /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/
  );
  const keyMatch = trimmed.match(
    /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC )?PRIVATE KEY-----/
  );

  if (!certMatch || !keyMatch) {
    throw new Error("PEM bundle incomplete");
  }

  return { cert: certMatch[0], key: keyMatch[0] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const efiClientId = Deno.env.get("EFI_CLIENT_ID")!;
    const efiClientSecret = Deno.env.get("EFI_CLIENT_SECRET")!;
    const efiCertBase64 = Deno.env.get("EFI_CERTIFICATE_P12_BASE64")!;

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
    const { txid } = body;

    if (!txid) {
      return new Response(
        JSON.stringify({ error: "txid required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse cert
    const { cert, key } = parsePemFromBase64(efiCertBase64);

    // Get OAuth token
    const credentials = btoa(`${efiClientId}:${efiClientSecret}`);
    const httpClient = Deno.createHttpClient({ cert, key });

    const tokenRes = await fetch(`${EFI_API_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
      client: httpClient,
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      httpClient.close();
      throw new Error(`EFI OAuth error: ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    // Check PIX charge status
    const cobRes = await fetch(`${EFI_API_BASE}/v2/cob/${txid}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      client: httpClient,
    });

    const cobData = await cobRes.json();
    httpClient.close();

    if (!cobRes.ok) {
      throw new Error(`EFI Cob check error: ${JSON.stringify(cobData)}`);
    }

    const pixStatus = cobData.status; // ATIVA, CONCLUIDA, REMOVIDA_PELO_USUARIO_RECEBEDOR, etc.
    const isPaid = pixStatus === "CONCLUIDA";

    // If paid, update subscription and billing_settings
    if (isPaid) {
      // Find subscription by efi_txid
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("efi_txid", txid)
        .maybeSingle();

      if (subscription && subscription.status !== "active") {
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + (subscription.plan_months || 1));
        const nextDueStr = nextDue.toISOString().split("T")[0];

        const paidAmount = cobData.valor?.original
          ? parseFloat(cobData.valor.original)
          : subscription.amount_per_cycle;

        const now = new Date().toISOString();

        // Update subscription
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            last_payment_date: now,
            last_payment_amount: paidAmount,
            next_due_date: nextDueStr,
            last_mp_status: "approved",
            updated_at: now,
          })
          .eq("id", subscription.id);

        // Record payment
        const pixPayments = cobData.pix || [];
        const endToEndId = pixPayments[0]?.endToEndId || txid;

        await supabase
          .from("subscription_payments")
          .insert({
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            store_id: subscription.store_id,
            amount: paidAmount,
            status: "approved",
            provider: "efi",
            provider_payment_id: endToEndId,
            paid_at: now,
            raw_payload: cobData,
          });

        // Sync billing_settings (used by BillingGateGuard for admin panel)
        // Find billing_settings by store_id from the subscription
        if (subscription.store_id) {
          await supabase
            .from("billing_settings")
            .update({
              status: "active",
              last_payment_date: now,
              last_payment_amount: paidAmount,
              next_due_date: nextDueStr,
              last_mp_status: "approved",
              current_plan_code: subscription.plan_code,
              current_plan_months: subscription.plan_months,
              current_plan_amount: subscription.amount_per_cycle,
              current_plan_discount_percent: subscription.discount_percent,
              updated_at: now,
            })
            .eq("store_id", subscription.store_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        txid,
        status: pixStatus,
        paid: isPaid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("EFI check PIX error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
