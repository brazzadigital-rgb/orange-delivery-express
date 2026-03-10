import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const size = url.searchParams.get("size") || "512";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const noCacheHeaders = {
    ...corsHeaders,
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "Content-Type": "image/png",
  };

  try {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("app_icon_192_url, app_icon_512_url, app_icon_maskable_url")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    let iconUrl = "";
    if (settings) {
      if (size === "192") iconUrl = settings.app_icon_192_url || "";
      else if (size === "maskable") iconUrl = settings.app_icon_maskable_url || settings.app_icon_512_url || "";
      else iconUrl = settings.app_icon_512_url || "";
    }

    if (!iconUrl) {
      return new Response("no icon configured", { status: 404, headers: noCacheHeaders });
    }

    // Proxy the image from storage with no-cache headers
    const imgRes = await fetch(iconUrl);
    if (!imgRes.ok) {
      return new Response("icon fetch failed", { status: 502, headers: noCacheHeaders });
    }

    const body = await imgRes.arrayBuffer();
    return new Response(body, {
      headers: {
        ...noCacheHeaders,
        "Content-Type": imgRes.headers.get("content-type") || "image/png",
        "Content-Length": String(body.byteLength),
      },
    });
  } catch (err) {
    console.error("serve-pwa-icon error:", err);
    return new Response("error", { status: 500, headers: noCacheHeaders });
  }
});
