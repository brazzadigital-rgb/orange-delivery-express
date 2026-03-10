// @ts-nocheck - Deno edge function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as webpush from "jsr:@negrel/webpush";

const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPID_SUBSCRIBER = "mailto:admin@speedslice.app";
const DEFAULT_TTL_SECONDS = 60 * 60; // 1h

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function base64UrlToBytes(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toVapidJwk(publicKeyB64Url: string, privateKeyB64Url: string) {
  const pub = base64UrlToBytes(publicKeyB64Url);
  let xBytes: Uint8Array;
  let yBytes: Uint8Array;

  // public key is typically uncompressed (0x04 + X + Y)
  if (pub.length === 65 && pub[0] === 4) {
    xBytes = pub.slice(1, 33);
    yBytes = pub.slice(33, 65);
  } else if (pub.length === 64) {
    // sometimes stored without 0x04 prefix
    xBytes = pub.slice(0, 32);
    yBytes = pub.slice(32, 64);
  } else {
    throw new Error("Invalid VAPID public key format");
  }

  const dBytes = base64UrlToBytes(privateKeyB64Url);
  if (dBytes.length !== 32) {
    throw new Error("Invalid VAPID private key format");
  }

  const x = bytesToBase64Url(xBytes);
  const y = bytesToBase64Url(yBytes);
  const d = bytesToBase64Url(dBytes);

  return {
    publicKey: { kty: "EC", crv: "P-256", x, y, ext: true },
    privateKey: { kty: "EC", crv: "P-256", x, y, d, ext: true },
  };
}

function hashEndpoint(endpoint: string): string {
  return endpoint.slice(-32);
}

let cachedVapidKeys: any | null = null;
let cachedAppServerPromise: Promise<any> | null = null;
async function getVapidKeys(publicKey: string, privateKey: string) {
  if (cachedVapidKeys) return cachedVapidKeys;
  // @negrel/webpush expects JWK keys exported by its own tooling.
  // Our env keys are base64url (common Web Push format), so we convert to JWK.
  const jwk = toVapidJwk(publicKey, privateKey);
  cachedVapidKeys = await webpush.importVapidKeys(jwk as any);
  return cachedVapidKeys;
}

async function getAppServer(vapidKeys: any) {
  if (cachedAppServerPromise) return cachedAppServerPromise;
  cachedAppServerPromise = webpush.ApplicationServer.new({
    contactInformation: VAPID_SUBSCRIBER,
    vapidKeys,
  });
  return cachedAppServerPromise;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidKeys = await getVapidKeys(vapidPublicKey, vapidPrivateKey);
    const appServer = await getAppServer(vapidKeys);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id, title, body: notifBody, url, tag, data, icon, image, ttl } = body;

    if (!user_id || !title || !notifBody) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!UUID_RE.test(String(user_id))) {
      return new Response(
        JSON.stringify({ error: "Invalid user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-push] Sending push to user ${user_id}: ${title}`);

    // For status bar rendering (especially Android), use same-origin URLs.
    // The "badge" is what shows in the status bar; it should be monochrome.
    let notificationIcon = icon || "/pwa-192x192.png";
    let notificationBadge = "/notification-badge.svg";
    
    try {
      // Keep the log for debugging purposes
      console.log(`[send-push] Using icon: ${notificationIcon}`);
    } catch (e) {
      console.warn("[send-push] Failed to fetch app settings:", e);
    }

    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true);

    if (fetchError) {
      console.error("[send-push] Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, total: 0, message: "No active subscriptions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      title,
      body: notifBody,
      icon: notificationIcon,
      badge: notificationBadge,
      image: image || null,
      tag: tag || "default",
      data: {
        url: url || "/app",
        ...(data ?? {}),
      },
    };

    const ttlSeconds = typeof ttl === "number" ? ttl : DEFAULT_TTL_SECONDS;

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const endpointHash = hashEndpoint(sub.endpoint);

        try {
          const subscriber = appServer.subscribe({
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          });

          const res = await subscriber.pushTextMessage(JSON.stringify(payload), {
            ttl: ttlSeconds,
          });

          // NOTE: In some runtimes, pushTextMessage may resolve without returning a Response.
          // Treat "no return" as success, and only use status/ok when available.
          const httpStatus = typeof (res as any)?.status === "number" ? (res as any).status : null;
          const ok = typeof (res as any)?.ok === "boolean" ? (res as any).ok : true;

          // Consume body when Response is available (avoid resource leaks)
          if (res && typeof (res as any).text === "function") {
            try {
              await (res as any).text();
            } catch {
              // ignore
            }
          }

          await supabase.from("push_delivery_logs").insert({
            user_id,
            endpoint_hash: endpointHash,
            status: ok ? "sent" : "failed",
            http_status: httpStatus,
            error_message: ok ? null : `HTTP ${httpStatus ?? "unknown"}`,
            payload,
          });

          return { success: ok, expired: false, status: httpStatus ?? 200 };
        } catch (e: any) {
          // PushMessageError wraps the push service response
          if (e instanceof webpush.PushMessageError) {
            const status = e.response?.status ?? 500;
            const expired = typeof e.isGone === "function" ? e.isGone() : status === 404 || status === 410;
            let responseText = "";
            if (e.response) {
              try {
                responseText = await e.response.text();
              } catch {
                // ignore
              }
            }

            await supabase.from("push_delivery_logs").insert({
              user_id,
              endpoint_hash: endpointHash,
              status: expired ? "expired" : "failed",
              http_status: status,
              error_message: expired
                ? "subscription_expired"
                : (responseText || e.message || `HTTP ${status}`),
              payload,
            });

            if (expired) {
              await supabase
                .from("push_subscriptions")
                .update({ is_active: false })
                .eq("id", sub.id);
            }

            return { success: false, expired, status };
          }

          const message = e?.message || String(e);
          console.error("[send-push] pushTextMessage exception:", message);

          await supabase.from("push_delivery_logs").insert({
            user_id,
            endpoint_hash: endpointHash,
            status: "failed",
            http_status: 500,
            error_message: message,
            payload,
          });

          return { success: false, expired: false, status: 500 };
        }
      })
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({ sent, failed, total: subscriptions.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-push] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});