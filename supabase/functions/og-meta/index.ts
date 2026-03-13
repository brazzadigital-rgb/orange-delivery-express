import { createClient } from "npm:@supabase/supabase-js@2";

const PORTAL_BASE_DOMAINS = ["deliverylitoral.com.br"];
const PORTAL_HOSTS = ["app", "www", "admin", "api"];

function extractSlug(hostname: string): string | null {
  const host = hostname.split(":")[0];
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) return null;
  if (PORTAL_BASE_DOMAINS.some((d) => host === d || host === `www.${d}`)) return null;

  for (const baseDomain of PORTAL_BASE_DOMAINS) {
    const suffix = `.${baseDomain}`;
    if (host.endsWith(suffix)) {
      const subdomain = host.slice(0, -suffix.length);
      if (subdomain && !subdomain.includes(".") && !PORTAL_HOSTS.includes(subdomain)) {
        return subdomain;
      }
      return null;
    }
  }

  const parts = host.split(".");
  if (parts.length >= 3 && !PORTAL_HOSTS.includes(parts[0])) return parts[0];
  return null;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  const url = new URL(req.url);
  // Accept ?host= param or ?slug= param or use referer/origin
  const hostParam = url.searchParams.get("host");
  const slugParam = url.searchParams.get("slug");
  const storeIdParam = url.searchParams.get("store_id");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let storeId: string | null = storeIdParam || null;
  let storeSlug: string | null = slugParam || null;

  // Resolve store from hostname
  if (!storeId && !storeSlug && hostParam) {
    storeSlug = extractSlug(hostParam);

    // Try custom domain match
    if (!storeSlug) {
      const { data: domainMatch } = await supabase
        .from("stores")
        .select("id, slug")
        .eq("custom_domain", hostParam.split(":")[0])
        .maybeSingle();
      if (domainMatch) {
        storeId = domainMatch.id;
      }
    }
  }

  // Fetch store by slug
  if (!storeId && storeSlug) {
    const { data: storeMatch } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .maybeSingle();
    if (storeMatch) storeId = storeMatch.id;
  }

  // Fetch app_settings
  let settings: any = null;
  if (storeId) {
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();
    settings = data;
  }

  // Fallback to platform_settings if no store
  if (!settings) {
    const { data: platform } = await supabase
      .from("platform_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const title = platform?.platform_name || "Delivery";
    const description = platform?.platform_description || "Peça agora e receba em casa!";
    const image = platform?.platform_og_image_url || "";

    return serveMeta(title, description, image, url.searchParams.get("url") || "");
  }

  const title = settings.app_name || "Delivery";
  const description = settings.app_description || "Peça agora e receba em casa!";
  const image = settings.app_icon_512_url || settings.app_icon_192_url || settings.app_logo_url || "";
  const pageUrl = url.searchParams.get("url") || "";

  return serveMeta(title, description, image, pageUrl);
});

function serveMeta(title: string, description: string, image: string, pageUrl: string) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  const u = escapeHtml(pageUrl);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  ${i ? `<meta property="og:image" content="${i}" />` : ""}
  ${u ? `<meta property="og:url" content="${u}" />` : ""}
  <meta property="og:site_name" content="${t}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  ${i ? `<meta name="twitter:image" content="${i}" />` : ""}
  ${u ? `<meta http-equiv="refresh" content="0;url=${u}" />` : ""}
</head>
<body>
  <p>${t} - ${d}</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
