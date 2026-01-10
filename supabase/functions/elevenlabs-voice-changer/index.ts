import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { audioUrl, voiceId } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    if (!audioUrl) {
      throw new Error("Audio URL is required");
    }

    if (!voiceId) {
      throw new Error("Voice ID is required");
    }

    console.log(`Processing voice change for user ${userData.user.id}`);
    console.log(`Audio URL: ${audioUrl}`);
    console.log(`Target Voice ID: ${voiceId}`);

    // Fetch the audio from the URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log(`Fetched audio: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    // Create form data for ElevenLabs API
    const formData = new FormData();
    formData.append("audio", audioBlob, "input.mp3");
    formData.append("model_id", "eleven_multilingual_sts_v2");
    // Voice settings for natural sound
    formData.append("voice_settings", JSON.stringify({
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true,
    }));

    // Call ElevenLabs Speech-to-Speech API
    const stsResponse = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: formData,
      }
    );

    if (!stsResponse.ok) {
      const errorText = await stsResponse.text();
      console.error("ElevenLabs STS API error:", errorText);
      throw new Error(`ElevenLabs API error: ${stsResponse.status} - ${errorText}`);
    }

    const changedAudioBuffer = await stsResponse.arrayBuffer();
    console.log(`Voice changed audio: ${changedAudioBuffer.byteLength} bytes`);

    // Upload the changed audio to Supabase Storage
    const fileName = `voice-changed/${userData.user.id}/${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("generated-media")
      .upload(fileName, changedAudioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload changed audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from("generated-media")
      .getPublicUrl(fileName);

    console.log(`Voice changed audio uploaded: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl: publicUrlData.publicUrl 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Voice changer error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
