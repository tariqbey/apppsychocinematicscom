import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProductionCredits } from "@/hooks/useProductionCredits";

export type VideoModel = 
  // Wan 2.1
  | "wan-ai/wan2.1-i2v-480p" 
  | "wan-ai/wan2.1-t2v-480p" 
  // Kling 1.0 (with video editing)
  | "kling-ai/v1.0/text-to-video"
  | "kling-ai/v1.0/image-to-video"
  | "kling-ai/v1.0/video-to-video" // Video editing
  // Google Veo 3 (VO3) - has audio
  | "google/veo3"
  | "google/veo3-fast"
  | "google/veo3-fast/image-to-video";

export type ImageModel = "gemini" | "nano-banana-pro";

export interface ImageGenerationParams {
  prompt: string;
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3";
  resolution?: "1k" | "2k" | "4k";
  images?: string[];
  model?: ImageModel;
  mode?: "create" | "edit";
}

export interface VideoGenerationParams {
  model: VideoModel;
  prompt: string;
  duration?: number;
  resolution?: "720p" | "1080p";
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  image?: string;
  cameo_video_url?: string; // URL of 1-4 second character video for Cameo
  cameo_prompt?: string;    // Character description for Cameo
}

export interface GeneratedMedia {
  id: string;
  user_id: string;
  media_type: "image" | "video" | "audio";
  model_used: string;
  prompt: string;
  media_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  prediction_id: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const MODEL_INFO: Record<VideoModel, { name: string; price: string; description: string }> = {
  // Wan 2.1
  "wan-ai/wan2.1-t2v-480p": { name: "Wan 2.1", price: "60-110 credits", description: "Fast text-to-video generation" },
  "wan-ai/wan2.1-i2v-480p": { name: "Wan 2.1 Image", price: "60-110 credits", description: "Animate images with Wan 2.1" },
  // Kling 1.0 (with video editing)
  "kling-ai/v1.0/text-to-video": { name: "Kling 1.0", price: "60-110 credits", description: "Kling AI with video editing features" },
  "kling-ai/v1.0/image-to-video": { name: "Kling 1.0 Image", price: "60-110 credits", description: "Animate images with Kling 1.0" },
  "kling-ai/v1.0/video-to-video": { name: "Kling 1.0 Editor", price: "~110 credits", description: "AI video editing with effects & transitions" },
  // Google Veo 3 (VO3) - has audio
  "google/veo3": { name: "Veo 3 (VO3)", price: "80-120 credits", description: "Google DeepMind with audio generation" },
  "google/veo3-fast": { name: "Veo 3 Fast", price: "60-100 credits", description: "Faster Veo 3 with audio" },
  "google/veo3-fast/image-to-video": { name: "Veo 3 Fast Image", price: "60-100 credits", description: "Animate images with audio" },
};

export function useMediaGeneration() {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { credits, deductCredits, fetchCredits, estimateCreditCost, canAfford } = useProductionCredits();

  // Check if user can afford a generation (uses credit-based check)
  const canAffordGeneration = useCallback((
    mediaType: "image" | "video",
    duration?: number,
    resolution?: string
  ): boolean => {
    return canAfford(mediaType, duration, resolution);
  }, [canAfford]);

  const generateImage = async (params: ImageGenerationParams): Promise<string | null> => {
    if (!user || !session) {
      toast({ title: "Please sign in", description: "You must be signed in to generate images.", variant: "destructive" });
      return null;
    }

    // Determine which model/function to use
    const useNanoBanana = params.model === "nano-banana-pro";
    const functionName = useNanoBanana ? "atlas-generate-image" : "lovable-generate-image";

    // Check balance first (in credits)
    const creditCost = estimateCreditCost("image", undefined, params.resolution);
    if (credits && !credits.isAdmin && credits.totalRemaining < creditCost) {
      toast({ 
        title: "Insufficient credits", 
        description: `You need ${creditCost} credits. You have ${credits.totalRemaining} credits.`, 
        variant: "destructive" 
      });
      return null;
    }

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    try {
      // Deduct before generation (backend handles the full cost with markup)
      if (!credits?.isAdmin) {
        const deductResult = await deductCredits("image", undefined, params.resolution);
        if (!deductResult.success) {
          throw new Error(deductResult.error || "Failed to deduct credits");
        }
        toast({
          title: "Credits deducted",
          description: `Used ${deductResult.creditsDeducted || creditCost} credits. ${deductResult.totalRemaining || 0} remaining.`,
        });
      }

      // Build request body - explicitly include images if provided
      const requestBody: Record<string, any> = {
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio,
        resolution: params.resolution,
        user_id: user.id,
      };

      if (params.mode) {
        requestBody.mode = params.mode;
      }
      
      // Only add images if array has items (for reference photo / edit mode)
      if (params.images && params.images.length > 0) {
        requestBody.images = params.images;
        console.log(
          `Sending image generation (${functionName}) with ${params.images.length} image(s):`,
          params.images[0].substring(0, 50)
        );
      }

      console.log(`Using ${functionName} for image generation, model: ${params.model || 'gemini'}`);

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
        functionName,
        {
          body: requestBody,
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!invokeData?.success) {
        throw new Error(invokeData?.error || "Failed to generate image");
      }

      setGeneratedImageUrl(invokeData.imageUrl);
      toast({ title: "Image generated!", description: "Your AI image is ready." });
      return invokeData.imageUrl;
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const checkVideoStatus = async (
    predictionId: string,
    provider: "atlas" | "kie" = "atlas"
  ): Promise<{ status: string; videoUrl?: string; error?: string }> => {
    if (!session) {
      return { status: "error", error: "Not authenticated" };
    }

    try {
      // Use the appropriate status checker based on provider
      const functionName = provider === "kie" ? "check-kie-video-status" : "check-video-status";
      const bodyKey = provider === "kie" ? "taskId" : "predictionId";
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { [bodyKey]: predictionId },
      });

      if (error) {
        return { status: "error", error: error.message };
      }

      return {
        status: data?.status || "error",
        videoUrl: data?.videoUrl,
        error: data?.error,
      };
    } catch (error) {
      console.error("Status check error:", error);
      return { status: "error", error: "Failed to check status" };
    }
  };

  const generateVideo = async (params: VideoGenerationParams): Promise<string | null> => {
    if (!user || !session) {
      toast({ title: "Please sign in", description: "You must be signed in to generate videos.", variant: "destructive" });
      return null;
    }

    const duration = params.duration ?? 5;

    // Check balance first (in credits)
    const creditCost = estimateCreditCost("video", duration);
    if (credits && !credits.isAdmin && credits.totalRemaining < creditCost) {
      toast({
        title: "Insufficient credits",
        description: `You need ${creditCost} credits. You have ${credits.totalRemaining} credits.`,
        variant: "destructive",
      });
      return null;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);

    try {
      // Deduct before generation (backend handles the full cost with markup)
      if (!credits?.isAdmin) {
        const deductResult = await deductCredits("video", duration);
        if (!deductResult.success) {
          throw new Error(deductResult.error || "Failed to deduct credits");
        }
        toast({
          title: "Credits deducted",
          description: `Used ${deductResult.creditsDeducted || creditCost} credits. ${deductResult.totalRemaining || 0} remaining.`,
        });
      }

      // All models now use Atlas Cloud
      const provider: "kie" | "atlas" = "atlas";
      const functionName = "atlas-generate-video";

      const { data: startData, error: startError } = await supabase.functions.invoke(
        functionName,
        {
          body: {
            prompt: params.prompt,
            duration,
            resolution: params.resolution,
            aspect_ratio: params.aspect_ratio,
            image: params.image,
            cameo_video_url: params.cameo_video_url,
            cameo_prompt: params.cameo_prompt,
            user_id: user.id,
            model: params.model,
          },
        }
      );

      if (startError) {
        throw new Error(startError.message);
      }

      if (!startData?.success) {
        throw new Error(startData?.error || "Failed to start video generation");
      }

      // Video generation started - now poll for completion
      const predictionId = startData.predictionId as string;

      toast({
        title: "Video generation started",
        description: "This may take a few minutes. Please wait...",
      });

      // Poll for completion
      const pollMs = 4_000;
      const maxMinutes = 10;
      const maxAttempts = Math.ceil((maxMinutes * 60 * 1000) / pollMs);

      let attempts = 0;
      let lastProgressToast = 0;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollMs));

        const statusResult = await checkVideoStatus(predictionId, provider);

        if (statusResult.status === "completed" && statusResult.videoUrl) {
          setGeneratedVideoUrl(statusResult.videoUrl);
          toast({ title: "Video generated!", description: "Your AI video is ready." });
          return statusResult.videoUrl;
        }

        if (statusResult.status === "failed") {
          throw new Error(statusResult.error || "Video generation failed");
        }

        attempts++;

        // Show progress toast every 2 minutes
        const elapsedMinutes = Math.floor((attempts * pollMs) / 60_000);
        if (elapsedMinutes > lastProgressToast && elapsedMinutes % 2 === 0) {
          lastProgressToast = elapsedMinutes;
          toast({
            title: "Still generating…",
            description: `${elapsedMinutes} minutes elapsed. Video is still processing.`,
          });
        }
      }

      // Don't treat this as a failure — jobs often finish after the UI wait window.
      toast({
        title: "Still processing in the background",
        description: `We waited ${maxMinutes} minutes. Your video may still finish — check the Media Library in a bit.`,
      });
      return null;
    } catch (error) {
      console.error("Video generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const fetchGenerationHistory = async (): Promise<GeneratedMedia[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("generated_media")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching generation history:", error);
      return [];
    }

    return data as GeneratedMedia[];
  };

  return {
    isGeneratingImage,
    isGeneratingVideo,
    generatedImageUrl,
    generatedVideoUrl,
    generateImage,
    generateVideo,
    fetchGenerationHistory,
    setGeneratedImageUrl,
    setGeneratedVideoUrl,
    credits,
    canAffordGeneration,
    refreshCredits: fetchCredits,
    estimateCreditCost,
  };
}
