import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProductionCredits } from "@/hooks/useProductionCredits";

export type VideoModel = 
  // Sora 2
  | "openai/sora-2/text-to-video-developer" 
  | "openai/sora-2/image-to-video" 
  // Wan 2.1
  | "wan-ai/wan2.1-i2v-480p" 
  | "wan-ai/wan2.1-t2v-480p" 
  // Kling v2.5 Turbo Pro
  | "kling-ai/v2.5-turbo-pro/text-to-video"
  | "kling-ai/v2.5-turbo-pro/image-to-video"
  // Legacy Kling (deprecated, maps to v2.5)
  | "kling-ai/v1-5/pro/image-to-video" 
  | "kling-ai/v1-5/pro/text-to-video"
  // Google Veo 3 (VO3)
  | "google/veo3"
  | "google/veo3-fast"
  | "google/veo3-fast/image-to-video";

export interface ImageGenerationParams {
  prompt: string;
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3";
  resolution?: "1k" | "2k" | "4k";
  images?: string[];
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
  media_type: "image" | "video";
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
  // Sora 2
  "openai/sora-2/text-to-video-developer": { name: "Sora 2 Developer", price: "60-110 credits", description: "OpenAI text-to-video with Cameo support" },
  "openai/sora-2/image-to-video": { name: "Sora 2 Image", price: "60-110 credits", description: "Animate an image with Sora 2" },
  // Wan 2.1
  "wan-ai/wan2.1-t2v-480p": { name: "Wan 2.1", price: "60-110 credits", description: "Fast text-to-video" },
  "wan-ai/wan2.1-i2v-480p": { name: "Wan 2.1 Image", price: "60-110 credits", description: "Image animation" },
  // Kling v2.5 Turbo Pro
  "kling-ai/v2.5-turbo-pro/text-to-video": { name: "Kling 2.5 Pro", price: "60-110 credits", description: "Kling AI text-to-video" },
  "kling-ai/v2.5-turbo-pro/image-to-video": { name: "Kling 2.5 Pro Image", price: "60-110 credits", description: "Kling AI image animation" },
  // Legacy Kling (deprecated)
  "kling-ai/v1-5/pro/text-to-video": { name: "Kling 1.5 Pro", price: "60-110 credits", description: "(Legacy) Kling text-to-video" },
  "kling-ai/v1-5/pro/image-to-video": { name: "Kling 1.5 Pro Image", price: "60-110 credits", description: "(Legacy) Kling image animation" },
  // Google Veo 3 (VO3)
  "google/veo3": { name: "Veo 3 (VO3)", price: "80-120 credits", description: "Google DeepMind text-to-video with audio" },
  "google/veo3-fast": { name: "Veo 3 Fast", price: "60-100 credits", description: "Faster Veo 3 generation with audio" },
  "google/veo3-fast/image-to-video": { name: "Veo 3 Fast Image", price: "60-100 credits", description: "Animate images with Veo 3" },
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

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
        "lovable-generate-image",
        {
          body: { ...params, user_id: user.id },
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

    const isSora = params.model.includes("openai/sora-2");
    const duration = params.duration ?? (isSora ? 5 : 5);

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

      // Use Kie.ai for Sora 2, Atlas for others
      let provider: "kie" | "atlas" = "atlas";
      let functionName = "atlas-generate-video";

      if (isSora) {
        provider = "kie";
        functionName = "kie-generate-video";
      }

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
        description: isSora
          ? "Sora 2 via Kie.ai typically takes 5-15 minutes. You can check your Media Library later."
          : "This may take a few minutes. Please wait...",
      });

      // Poll for completion
      const pollMs = isSora ? 10_000 : 4_000;
      const maxMinutes = isSora ? 20 : 10;
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
            description: `${elapsedMinutes} minutes elapsed. ${isSora ? "Sora 2" : "Video"} is still processing.`,
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
