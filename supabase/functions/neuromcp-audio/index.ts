import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HF_SPACE_URL = "https://sensein-mouse-prosap1-shank2-male-female-oestrus-4021ab0.hf.space";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user.email?.toLowerCase().endsWith("@mit.edu")) {
      return new Response(JSON.stringify({ error: "Access restricted to MIT users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the audio file path from request
    const { audioPath } = await req.json();
    if (!audioPath) {
      return new Response(JSON.stringify({ error: "audioPath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download audio from Supabase Storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from("neuromcp-audio")
      .download(audioPath);

    if (downloadError || !audioData) {
      throw new Error(`Failed to download audio: ${downloadError?.message}`);
    }

    // Send audio to HF Space for inference
    const formData = new FormData();
    formData.append("audio_file", audioData, "audio.wav");

    console.log("Calling HF Space for USV detection...");
    const hfResponse = await fetch(`${HF_SPACE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [`data:audio/wav;base64,${await blobToBase64(audioData)}`],
      }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      console.error("HF Space error:", errText);
      throw new Error(`HF inference failed: ${hfResponse.status}`);
    }

    const hfResult = await hfResponse.json();
    console.log("HF result keys:", Object.keys(hfResult));

    // The Gradio API returns data array — first element is the spectrogram image
    const spectrogramData = hfResult.data?.[0];
    if (!spectrogramData) {
      throw new Error("No spectrogram returned from model");
    }

    // Extract base64 image data (Gradio returns data:image/png;base64,...)
    let imageBase64: string;
    if (typeof spectrogramData === "string" && spectrogramData.startsWith("data:")) {
      imageBase64 = spectrogramData.split(",")[1];
    } else if (typeof spectrogramData === "object" && spectrogramData.url) {
      // Gradio may return a URL — fetch it
      const imgResp = await fetch(spectrogramData.url);
      const imgBlob = await imgResp.blob();
      imageBase64 = await blobToBase64(imgBlob);
    } else {
      imageBase64 = spectrogramData;
    }

    // Upload spectrogram to storage
    const spectrogramPath = `spectrograms/${user.id}/${Date.now()}_spectrogram.png`;
    const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("neuromcp-audio")
      .upload(spectrogramPath, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload spectrogram: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("neuromcp-audio")
      .getPublicUrl(spectrogramPath);

    // Extract detection metadata if available (second element)
    const detectionMeta = hfResult.data?.[1] || null;

    return new Response(
      JSON.stringify({
        success: true,
        spectrogramUrl: urlData.publicUrl,
        detections: detectionMeta,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Audio processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
