import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProductionCredits } from "@/hooks/useProductionCredits";

export type VideoModel = "openai/sora-2/text-to-video-developer" | "openai/sora-2/image-to-video" | "wan-ai/wan2.1-i2v-480p" | "wan-ai/wan2.1-t2v-480p" | "kling-ai/v1-5/pro/image-to-video" | "kling-ai/v1-5/pro/text-to-video";

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
  cameo_id?: string;
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
  "openai/sora-2/text-to-video-developer": { name: "Sora 2 Developer", price: "60-110 credits", description: "OpenAI text-to-video with Cameo support" },
  "openai/sora-2/image-to-video": { name: "Sora 2 Image", price: "60-110 credits", description: "Animate an image" },
  "wan-ai/wan2.1-t2v-480p": { name: "Wan 2.1", price: "60-110 credits", description: "Fast text-to-video" },
  "wan-ai/wan2.1-i2v-480p": { name: "Wan 2.1 Image", price: "60-110 credits", description: "Image animation" },
  "kling-ai/v1-5/pro/text-to-video": { name: "Kling 1.5 Pro", price: "60-110 credits", description: "Kling text-to-video" },
  "kling-ai/v1-5/pro/image-to-video": { name: "Kling 1.5 Pro Image", price: "60-110 credits", description: "Kling image animation" },
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lovable-generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...params, user_id: user.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedImageUrl(data.imageUrl);
      toast({ title: "Image generated!", description: "Your AI image is ready." });
      return data.imageUrl;
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

  const checkVideoStatus = async (predictionId: string): Promise<{ status: string; videoUrl?: string; error?: string }> => {
    if (!session) {
      return { status: "error", error: "Not authenticated" };
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ predictionId }),
      });

      const data = await response.json();
      return {
        status: data.status || "error",
        videoUrl: data.videoUrl,
        error: data.error,
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

    const duration = params.duration || 10;
    
    // Check balance first (in credits)
    const creditCost = estimateCreditCost("video", duration);
    if (credits && !credits.isAdmin && credits.totalRemaining < creditCost) {
      toast({ 
        title: "Insufficient credits", 
        description: `You need ${creditCost} credits. You have ${credits.totalRemaining} credits.`, 
        variant: "destructive" 
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/atlas-generate-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...params, user_id: user.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to start video generation");
      }

      // Video generation started - now poll for completion
      const predictionId = data.predictionId;
      toast({ 
        title: "Video generation started", 
        description: "This may take 2-5 minutes. Please wait..." 
      });

      // Poll for completion (max 6 minutes)
      const maxAttempts = 90; // 90 * 4 seconds = 6 minutes
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 4000)); // Wait 4 seconds
        
        const statusResult = await checkVideoStatus(predictionId);
        
        if (statusResult.status === "completed" && statusResult.videoUrl) {
          setGeneratedVideoUrl(statusResult.videoUrl);
          toast({ title: "Video generated!", description: "Your AI video is ready." });
          return statusResult.videoUrl;
        } else if (statusResult.status === "failed") {
          throw new Error(statusResult.error || "Video generation failed");
        }
        
        attempts++;
      }

      throw new Error("Video generation timed out. Check Media Library later.");
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
