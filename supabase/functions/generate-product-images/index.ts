import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProductInfo {
  id: string;
  name: string;
  description: string | null;
  category_name: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { store_id, store_type } = await req.json();

    if (!store_id) {
      return new Response(
        JSON.stringify({ error: "store_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch all products for this store with their category names
    const { data: products, error: fetchError } = await admin
      .from("products")
      .select("id, name, description, categories(name)")
      .eq("store_id", store_id)
      .is("image_url", null);

    if (fetchError) {
      console.error("Fetch products error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch products" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ success: true, generated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-product-images] Generating images for ${products.length} products, store_type: ${store_type}`);

    let generated = 0;
    const errors: string[] = [];

    // Process products sequentially to avoid rate limiting
    for (const product of products) {
      const categoryName = (product as any).categories?.name || "";
      const prompt = buildPrompt(product.name, product.description, categoryName, store_type);

      try {
        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for "${product.name}":`, aiResponse.status, errText);
          errors.push(`${product.name}: AI ${aiResponse.status}`);
          // If rate limited, wait before continuing
          if (aiResponse.status === 429) {
            await new Promise((r) => setTimeout(r, 5000));
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const imageDataUrl =
          aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
          console.error(`No image for "${product.name}"`);
          errors.push(`${product.name}: no image`);
          continue;
        }

        // Convert base64 to binary
        const base64Data = imageDataUrl.split(",")[1];
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        // Upload to products bucket
        const fileName = `demo-${store_id}/${product.id}.png`;
        const { error: uploadError } = await admin.storage
          .from("products")
          .upload(fileName, bytes, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for "${product.name}":`, uploadError);
          errors.push(`${product.name}: upload failed`);
          continue;
        }

        const { data: urlData } = admin.storage
          .from("products")
          .getPublicUrl(fileName);

        // Update product with image URL
        const { error: updateError } = await admin
          .from("products")
          .update({ image_url: urlData.publicUrl })
          .eq("id", product.id);

        if (updateError) {
          console.error(`Update error for "${product.name}":`, updateError);
          errors.push(`${product.name}: update failed`);
          continue;
        }

        generated++;
        console.log(`[generate-product-images] ✓ ${product.name}`);

        // Small delay between requests to avoid rate limiting
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        console.error(`Error processing "${product.name}":`, err);
        errors.push(`${product.name}: ${err}`);
      }
    }

    console.log(`[generate-product-images] Done: ${generated}/${products.length} generated`);

    return new Response(
      JSON.stringify({
        success: true,
        generated,
        total: products.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPrompt(
  name: string,
  description: string | null,
  categoryName: string,
  storeType: string | null
): string {
  const segment = storeType || "food";
  return `Professional food photography of "${name}"${description ? ` - ${description}` : ""}. 
Category: ${categoryName || segment}. 
Style: Top-down or 45-degree angle shot, beautiful plating on a clean surface, warm natural lighting, shallow depth of field, vibrant colors, appetizing presentation. 
The image should look like a real restaurant menu photo. No text, no watermarks, no logos. Square format.`;
}
