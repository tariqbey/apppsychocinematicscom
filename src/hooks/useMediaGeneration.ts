import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type VideoModel = "google/veo3" | "google/veo3-fast" | "openai/sora-2/text-to-video" | "openai/sora-2/image-to-video" | "wan-ai/wan2.1-i2v-480p" | "wan-ai/wan2.1-t2v-480p" | "kling-ai/v1-5/pro/image-to-video" | "kling-ai/v1-5/pro/text-to-video";

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
  generate_audio?: boolean;
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
  "google/veo3": { name: "Veo 3 Premium", price: "$6/5s", description: "Highest quality with audio" },
  "google/veo3-fast": { name: "Veo 3 Fast", price: "$2/5s", description: "Fast and balanced" },
  "openai/sora-2/text-to-video": { name: "Sora 2", price: "$0.10/s", description: "OpenAI text-to-video" },
  "openai/sora-2/image-to-video": { name: "Sora 2 Image", price: "$0.10/s", description: "Animate an image" },
  "wan-ai/wan2.1-t2v-480p": { name: "Wan 2.1", price: "$0.05/s", description: "Fast text-to-video" },
  "wan-ai/wan2.1-i2v-480p": { name: "Wan 2.1 Image", price: "$0.05/s", description: "Image animation" },
  "kling-ai/v1-5/pro/text-to-video": { name: "Kling 1.5 Pro", price: "$0.08/s", description: "Kling text-to-video" },
  "kling-ai/v1-5/pro/image-to-video": { name: "Kling 1.5 Pro Image", price: "$0.08/s", description: "Kling image animation" },
};

export function useMediaGeneration() {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateImage = async (params: ImageGenerationParams): Promise<string | null> => {
    if (!user) {
      toast({ title: "Please sign in", description: "You must be signed in to generate images.", variant: "destructive" });
      return null;
    }

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/atlas-generate-image`, {
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

    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);

    try {
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
  };
}
