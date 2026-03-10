import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EFI_API_BASE = "https://pix.api.efipay.com.br";
const EFI_API_BASE_SANDBOX = "https://pix-h.api.efipay.com.br";

async function getEfiAccessToken(
  clientId: string,
  clientSecret: string,
  certPem: string,
  keyPem: string,
  sandbox: boolean
): Promise<string> {
  const base = sandbox ? EFI_API_BASE_SANDBOX : EFI_API_BASE;
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const httpClient = Deno.createHttpClient({
    cert: certPem,
    key: keyPem,
  });

  const response = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
    client: httpClient,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`EFI OAuth error: ${JSON.stringify(data)}`);
  }

  httpClient.close();
  return data.access_token;
}

async function createPixCharge(
  accessToken: string,
  certPem: string,
  keyPem: string,
  sandbox: boolean,
  payload: {
    valor: string;
    chave: string;
    infoAdicionais?: Array<{ nome: string; valor: string }>;
    calendario?: { expiracao: number };
    devedor?: { cpf?: string; cnpj?: string; nome: string };
  }
) {
  const base = sandbox ? EFI_API_BASE_SANDBOX : EFI_API_BASE;

  const httpClient = Deno.createHttpClient({
    cert: certPem,
    key: keyPem,
  });

  // Create immediate charge (without txid — EFI generates it)
  const cobResponse = await fetch(`${base}/v2/cob`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      calendario: payload.calendario || { expiracao: 3600 },
      valor: { original: payload.valor },
      chave: payload.chave,
      infoAdicionais: payload.infoAdicionais || [],
    }),
    client: httpClient,
  });

  const cobData = await cobResponse.json();
  if (!cobResponse.ok) {
    httpClient.close();
    throw new Error(`EFI Cob error: ${JSON.stringify(cobData)}`);
  }

  // Get QR code
  const locId = cobData.loc?.id;
  let qrCode = null;
  if (locId) {
    const qrResponse = await fetch(`${base}/v2/loc/${locId}/qrcode`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      client: httpClient,
    });

    if (qrResponse.ok) {
      qrCode = await qrResponse.json();
    } else {
      await qrResponse.text();
    }
  }

  httpClient.close();

  return {
    txid: cobData.txid,
    loc: cobData.loc,
    status: cobData.status,
    pixCopiaECola: qrCode?.qrcode || cobData.pixCopiaECola || null,
    qrCodeImage: qrCode?.imagemQrcode || null,
    expiracao: cobData.calendario?.expiracao,
  };
}

function parsePkcs12Base64(p12Base64: string): { cert: string; key: string } {
  // Clean the base64 string (remove whitespace, newlines, BOM)
  const cleaned = p12Base64.replace(/[\s\r\n\uFEFF]/g, '');
  
  let decoded: string;
  try {
    decoded = atob(cleaned);
  } catch (e) {
    throw new Error(
      `Failed to decode base64. First 20 chars: "${cleaned.substring(0, 20)}". ` +
      `Expected PEM content encoded in base64 (should start with LS0tLS1CRUdJTi).`
    );
  }

  // Trim any BOM or whitespace from decoded content
  const trimmed = decoded.replace(/^\uFEFF/, '').trim();

  // Check if content contains PEM blocks (may have "Bag Attributes" metadata before them)
  if (trimmed.includes("-----BEGIN")) {
    const certMatch = trimmed.match(
      /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/
    );
    const keyMatch = trimmed.match(
      /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC )?PRIVATE KEY-----/
    );

    if (!certMatch || !keyMatch) {
      const hasCert = !!certMatch;
      const hasKey = !!keyMatch;
      throw new Error(
        `PEM bundle incomplete. Found CERTIFICATE: ${hasCert}, Found PRIVATE KEY: ${hasKey}. ` +
        `Make sure to convert with: openssl pkcs12 -in cert.p12 -out combined.pem -nodes`
      );
    }

    return { cert: certMatch[0], key: keyMatch[0] };
  }

  // Show diagnostic info
  const firstChars = trimmed.substring(0, 30).replace(/[^\x20-\x7E]/g, '?');
  const b64Start = cleaned.substring(0, 30);
  throw new Error(
    `Certificate is not in PEM format. ` +
    `Base64 starts with: "${b64Start}". ` +
    `Decoded starts with: "${firstChars}". ` +
    `Expected decoded to start with "-----BEGIN". ` +
    `Convert with: openssl pkcs12 -in cert.p12 -out combined.pem -nodes && base64 combined.pem`
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const efiClientId = Deno.env.get("EFI_CLIENT_ID");
    const efiClientSecret = Deno.env.get("EFI_CLIENT_SECRET");
    const efiCertBase64 = Deno.env.get("EFI_CERTIFICATE_P12_BASE64");
    const efiPixKey = Deno.env.get("EFI_PIX_KEY");

    if (!efiClientId || !efiClientSecret || !efiCertBase64 || !efiPixKey) {
      return new Response(
        JSON.stringify({ error: "EFI credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { subscription_id, amount, plan_name, plan_slug, sandbox = false } = body;

    // Auth is required only when updating a subscription
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const { data: { user: authUser } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      user = authUser;
    }

    // If subscription_id is provided, user must be authenticated
    if (subscription_id && !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!amount) {
      return new Response(
        JSON.stringify({ error: "amount is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse certificate
    const { cert, key } = parsePkcs12Base64(efiCertBase64);

    // Get OAuth token
    const accessToken = await getEfiAccessToken(
      efiClientId,
      efiClientSecret,
      cert,
      key,
      sandbox
    );

    // Create PIX charge
    const pixResult = await createPixCharge(
      accessToken,
      cert,
      key,
      sandbox,
      {
        valor: Number(amount).toFixed(2),
        chave: efiPixKey,
        infoAdicionais: [
          { nome: "Assinatura", valor: plan_name || "Plano" },
        ],
        calendario: { expiracao: 3600 }, // 1 hour
      }
    );

    // Save PIX info to subscription only if subscription_id is provided
    if (subscription_id) {
      const { error: updateErr } = await supabase
        .from("subscriptions")
        .update({
          efi_txid: pixResult.txid,
          efi_pix_copia_cola: pixResult.pixCopiaECola,
          efi_qrcode_image: pixResult.qrCodeImage,
          payment_provider: "efi",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription_id);

      if (updateErr) {
        console.error("Error updating subscription with PIX data:", updateErr);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        txid: pixResult.txid,
        pix_copia_cola: pixResult.pixCopiaECola,
        qrcode_image: pixResult.qrCodeImage,
        status: pixResult.status,
        expiracao: pixResult.expiracao,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("EFI PIX error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
