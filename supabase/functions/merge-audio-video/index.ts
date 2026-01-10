import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Parse request body
    const { videoUrl, audioUrl } = await req.json();
    
    if (!videoUrl || !audioUrl) {
      return new Response(
        JSON.stringify({ error: "Missing videoUrl or audioUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Merging video:", videoUrl, "with audio:", audioUrl);

    // Download video
    console.log("Downloading video...");
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }
    const videoData = await videoResponse.arrayBuffer();
    console.log("Video downloaded, size:", videoData.byteLength);

    // Download audio
    console.log("Downloading audio...");
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    const audioData = await audioResponse.arrayBuffer();
    console.log("Audio downloaded, size:", audioData.byteLength);

    // Write files to temp directory
    const tempDir = await Deno.makeTempDir();
    const videoPath = `${tempDir}/input.mp4`;
    const audioPath = `${tempDir}/audio.mp3`;
    const outputPath = `${tempDir}/output.mp4`;

    await Deno.writeFile(videoPath, new Uint8Array(videoData));
    await Deno.writeFile(audioPath, new Uint8Array(audioData));
    console.log("Files written to temp directory");

    // Run FFmpeg to merge audio and video
    console.log("Running FFmpeg...");
    const ffmpegProcess = new Deno.Command("ffmpeg", {
      args: [
        "-i", videoPath,
        "-i", audioPath,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        "-y",
        outputPath,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const ffmpegOutput = await ffmpegProcess.output();
    
    if (!ffmpegOutput.success) {
      const errorText = new TextDecoder().decode(ffmpegOutput.stderr);
      console.error("FFmpeg error:", errorText);
      throw new Error(`FFmpeg failed: ${errorText}`);
    }

    console.log("FFmpeg completed successfully");

    // Read output file
    const outputData = await Deno.readFile(outputPath);
    console.log("Output file size:", outputData.byteLength);

    // Upload to storage
    const fileName = `voice-changed/${user.id}/merged-${Date.now()}.mp4`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-media")
      .upload(fileName, outputData, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload merged video: ${uploadError.message}`);
    }

    console.log("Uploaded to:", fileName);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("generated-media")
      .getPublicUrl(fileName);

    console.log("Public URL:", publicUrl);

    // Cleanup temp files
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch (cleanupError) {
      console.warn("Cleanup warning:", cleanupError);
    }

    return new Response(
      JSON.stringify({ mergedUrl: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Merge error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Merge failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
