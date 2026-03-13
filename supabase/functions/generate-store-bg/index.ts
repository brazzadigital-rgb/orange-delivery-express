import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map store types to AI image prompts
const STORE_TYPE_PROMPTS: Record<string, string> = {
  pizzaria:
    "Abstract warm background with subtle pizza-themed pattern, melting cheese textures, warm orange and red tones, soft focus food photography style, elegant and modern, no text, no logos, suitable as a mobile app header background",
  hamburgueria:
    "Abstract warm background with subtle burger-themed elements, grilled textures, warm brown and golden tones, smoke wisps, soft focus food photography style, elegant and modern, no text, no logos, suitable as a mobile app header background",
  sushi:
    "Abstract elegant background with subtle Japanese food elements, bamboo textures, dark green and warm wooden tones, zen minimalist style, soft focus, no text, no logos, suitable as a mobile app header background",
  bebidas:
    "Abstract cool background with subtle beverage elements, ice crystals, condensation droplets, cool blue and golden amber tones, refreshing modern style, no text, no logos, suitable as a mobile app header background",
  acai:
    "Abstract vibrant background with subtle açaí berry elements, tropical fruit textures, deep purple and green tones, fresh and healthy modern style, no text, no logos, suitable as a mobile app header background",
  padaria:
    "Abstract warm background with subtle bakery elements, flour dust particles, golden bread textures, warm wheat and cream tones, rustic elegant style, no text, no logos, suitable as a mobile app header background",
  restaurante:
    "Abstract sophisticated background with subtle dining elements, elegant plate textures, warm ambient lighting tones, fine dining modern style, no text, no logos, suitable as a mobile app header background",
  marmitaria:
    "Abstract warm background with subtle comfort food elements, steaming textures, warm homestyle brown and green tones, cozy modern style, no text, no logos, suitable as a mobile app header background",
  generico:
    "Abstract modern background with subtle food delivery elements, warm gradient tones, orange and coral colors, clean and professional style, no text, no logos, suitable as a mobile app header background",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { store_id, store_type } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = STORE_TYPE_PROMPTS[store_type || "generico"] || STORE_TYPE_PROMPTS.generico;

    console.log(`[generate-store-bg] Generating for store ${store_id}, type: ${store_type}`);

    // Generate image via Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI generation failed", status: aiResponse.status }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
      console.error("No image in AI response");
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert base64 data URL to binary
    const base64Data = imageDataUrl.split(",")[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const fileName = `home-bg-${store_id}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("app-splash")
      .upload(fileName, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = admin.storage.from("app-splash").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Update app_settings with the new background
    const { error: updateError } = await admin
      .from("app_settings")
      .update({ home_bg_image_url: publicUrl })
      .eq("store_id", store_id);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    console.log(`[generate-store-bg] Success: ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
