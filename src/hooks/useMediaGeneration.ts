import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProductionCredits, API_COSTS } from "@/hooks/useProductionCredits";

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
  "openai/sora-2/text-to-video-developer": { name: "Sora 2 Developer", price: "$1/10s", description: "OpenAI text-to-video with Cameo support" },
  "openai/sora-2/image-to-video": { name: "Sora 2 Image", price: "$1/10s", description: "Animate an image" },
  "wan-ai/wan2.1-t2v-480p": { name: "Wan 2.1", price: "$1/10s", description: "Fast text-to-video" },
  "wan-ai/wan2.1-i2v-480p": { name: "Wan 2.1 Image", price: "$1/10s", description: "Image animation" },
  "kling-ai/v1-5/pro/text-to-video": { name: "Kling 1.5 Pro", price: "$1/10s", description: "Kling text-to-video" },
  "kling-ai/v1-5/pro/image-to-video": { name: "Kling 1.5 Pro Image", price: "$1/10s", description: "Kling image animation" },
};

export function useMediaGeneration() {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { credits, deductCredits, fetchCredits, estimateCost, estimateDisplayCost, canAfford } = useProductionCredits();

  // Calculate cost for a generation (in dollars)
  const calculateCreditCost = useCallback((
    mediaType: "image" | "video",
    duration?: number,
    resolution?: string
  ): number => {
    if (mediaType === "video") {
      return (duration || 10) * API_COSTS.video.perSecond;
    } else {
      const res = resolution?.toLowerCase() || "2k";
      return res.includes("4k") ? API_COSTS.image["4k"] : API_COSTS.image["2k"];
    }
  }, []);

  // Check if user can afford a generation
  const canAffordGeneration = useCallback((
    mediaType: "image" | "video",
    duration?: number,
    resolution?: string
  ): boolean => {
    if (!credits) return false;
    if (credits.isAdmin) return true;
    const cost = calculateCreditCost(mediaType, duration, resolution);
    return credits.totalRemaining >= cost;
  }, [credits, calculateCreditCost]);

  const generateImage = async (params: ImageGenerationParams): Promise<string | null> => {
    if (!user) {
      toast({ title: "Please sign in", description: "You must be signed in to generate images.", variant: "destructive" });
      return null;
    }

    // Check balance first
    const cost = calculateCreditCost("image", undefined, params.resolution);
    if (credits && !credits.isAdmin && credits.totalRemaining < cost) {
      toast({ 
        title: "Insufficient balance", 
        description: `You need $${cost.toFixed(2)}. You have $${credits.totalRemaining.toFixed(2)}.`, 
        variant: "destructive" 
      });
      return null;
    }

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    try {
      // Deduct before generation
      if (!credits?.isAdmin) {
        const deductResult = await deductCredits("image", undefined, params.resolution);
        if (!deductResult.success) {
          throw new Error(deductResult.error || "Failed to deduct usage");
        }
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lovable-generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

  const generateVideo = async (params: VideoGenerationParams): Promise<string | null> => {
    if (!user) {
      toast({ title: "Please sign in", description: "You must be signed in to generate videos.", variant: "destructive" });
      return null;
    }

    const duration = params.duration || 10;
    
    // Check balance first
    const cost = calculateCreditCost("video", duration);
    if (credits && !credits.isAdmin && credits.totalRemaining < cost) {
      toast({ 
        title: "Insufficient balance", 
        description: `You need $${cost.toFixed(2)}. You have $${credits.totalRemaining.toFixed(2)}.`, 
        variant: "destructive" 
      });
      return null;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);

    try {
      // Deduct before generation
      if (!credits?.isAdmin) {
        const deductResult = await deductCredits("video", duration);
        if (!deductResult.success) {
          throw new Error(deductResult.error || "Failed to deduct usage");
        }
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/atlas-generate-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ ...params, user_id: user.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate video");
      }

      setGeneratedVideoUrl(data.videoUrl);
      toast({ title: "Video generated!", description: "Your AI video is ready." });
      return data.videoUrl;
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
    calculateCreditCost,
    canAffordGeneration,
    refreshCredits: fetchCredits,
    estimateDisplayCost,
  };
}
