import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { store_id, store_type, limit } = await req.json();

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

    // Fetch products without images (limit to batch size to avoid timeout)
    const batchSize = limit || 3;
    const { data: products, error: fetchError } = await admin
      .from("products")
      .select("id, name, description, categories(name)")
      .eq("store_id", store_id)
      .is("image_url", null)
      .limit(batchSize);

    if (fetchError) {
      console.error("Fetch products error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch products" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ success: true, generated: 0, remaining: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count total remaining (including current batch)
    const { count: totalRemaining } = await admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store_id)
      .is("image_url", null);

    console.log(`[generate-product-images] Batch of ${products.length}/${totalRemaining} products, type: ${store_type}`);

    let generated = 0;

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
          if (aiResponse.status === 429) {
            await new Promise((r) => setTimeout(r, 3000));
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
          console.error(`No image for "${product.name}"`);
          continue;
        }

        // Convert base64 to binary
        const base64Data = imageDataUrl.split(",")[1];
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const fileName = `demo-${store_id}/${product.id}.png`;
        const { error: uploadError } = await admin.storage
          .from("products")
          .upload(fileName, bytes, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error(`Upload error for "${product.name}":`, uploadError);
          continue;
        }

        const { data: urlData } = admin.storage.from("products").getPublicUrl(fileName);

        await admin
          .from("products")
          .update({ image_url: urlData.publicUrl })
          .eq("id", product.id);

        generated++;
        console.log(`[generate-product-images] ✓ ${product.name}`);
      } catch (err) {
        console.error(`Error processing "${product.name}":`, err);
      }
    }

    const remaining = (totalRemaining || 0) - generated;

    console.log(`[generate-product-images] Done: ${generated} generated, ${remaining} remaining`);

    return new Response(
      JSON.stringify({ success: true, generated, remaining }),
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
  return `Professional food photography of "${name}"${description ? ` - ${description}` : ""}. Category: ${categoryName || storeType || "food"}. Style: Top-down or 45-degree angle shot, beautiful plating on a clean surface, warm natural lighting, shallow depth of field, vibrant colors, appetizing presentation. The image should look like a real restaurant menu photo. No text, no watermarks, no logos. Square format.`;
}
