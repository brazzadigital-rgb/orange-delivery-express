import { createClient } from "npm:@supabase/supabase-js@2";

const baseHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/manifest+json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "CDN-Cache-Control": "no-store",
  "Surrogate-Control": "no-store",
};

function getAppOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore
    }
  }

  return "https://speed-slice.lovable.app";
}

function buildHeaders(req: Request): Record<string, string> {
  const reqOrigin = req.headers.get("origin");
  return {
    ...baseHeaders,
    "Access-Control-Allow-Origin": reqOrigin ?? "*",
    "Vary": "Origin",
  };
}

const MANIFEST_VERSION = "v3.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildHeaders(req) });
  }

  const appOrigin = getAppOrigin(req);
  const headers = buildHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const storageBase = `${supabaseUrl}/storage/v1/object/public`;

  // NO static fallback icons - everything comes from DB or storage
  const defaultManifest = {
    name: "Delivery",
    short_name: "Delivery",
    description: "Peça agora e receba em casa!",
    theme_color: "#FF8A00",
    background_color: "#FFFFFF",
    display: "standalone",
    orientation: "portrait",
    scope: `${appOrigin}/`,
    start_url: `${appOrigin}/app/home`,
    _version: MANIFEST_VERSION,
    icons: [],
  };

  try {
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: allSettings, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !allSettings || allSettings.length === 0) {
      return new Response(JSON.stringify(defaultManifest), { headers });
    }

    const settings = allSettings[0];

    // Use epoch ms from updated_at as version
    const v = settings.updated_at
      ? String(new Date(settings.updated_at).getTime())
      : String(Date.now());

    // ONLY use storage URLs - NEVER fallback to static files
    const icon192 = settings.app_icon_192_url;
    const icon512 = settings.app_icon_512_url;
    const iconMaskable = settings.app_icon_maskable_url || icon512;

    const icons = [];
    if (icon192) icons.push({ src: `${icon192}?v=${v}`, sizes: "192x192", type: "image/png" });
    if (icon512) icons.push({ src: `${icon512}?v=${v}`, sizes: "512x512", type: "image/png" });
    if (iconMaskable) icons.push({ src: `${iconMaskable}?v=${v}`, sizes: "512x512", type: "image/png", purpose: "maskable" });
    icons.push({ src: `${appOrigin}/notification-badge.svg`, sizes: "512x512", type: "image/svg+xml", purpose: "monochrome" });

    const manifest = {
      id: `${appOrigin}/app/home`,
      name: settings.app_name || defaultManifest.name,
      short_name: settings.app_short_name || defaultManifest.short_name,
      description: settings.app_description || defaultManifest.description,
      theme_color: settings.theme_color || defaultManifest.theme_color,
      background_color: settings.background_color || defaultManifest.background_color,
      display: "standalone",
      orientation: "portrait",
      scope: `${appOrigin}/`,
      start_url: `${appOrigin}/app/home`,
      _version: MANIFEST_VERSION,
      icons,
    };

    return new Response(JSON.stringify(manifest), { headers });
  } catch (err) {
    console.error("Error serving manifest:", err);
    return new Response(JSON.stringify(defaultManifest), { headers });
  }
});
