import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProductionCredits } from "./useProductionCredits";
import { useToast } from "./use-toast";

export interface WatermarkRemovalResult {
  success: boolean;
  predictionId?: string;
  mediaId?: string;
  error?: string;
}

export const useWatermarkRemoval = () => {
  const { session } = useAuth();
  const { deductCredits, canAfford, estimateCreditCost } = useProductionCredits();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const removeWatermark = useCallback(async (
    videoUrl: string,
    originalMediaId?: string
  ): Promise<WatermarkRemovalResult> => {
    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user can afford the operation (10 credits)
    if (!canAfford("watermarkRemoval")) {
      const cost = estimateCreditCost("watermarkRemoval");
      toast({
        title: "Insufficient credits",
        description: `Watermark removal costs ${cost} credits. Please purchase more credits.`,
        variant: "destructive",
      });
      return { success: false, error: "Insufficient credits" };
    }

    setIsProcessing(true);

    try {
      // Deduct credits first
      const deductResult = await deductCredits("watermarkRemoval");
      if (!deductResult.success) {
        throw new Error(deductResult.error || "Failed to deduct credits");
      }

      // Call the watermark removal edge function
      const { data, error } = await supabase.functions.invoke("remove-sora-watermark", {
        body: { videoUrl, originalMediaId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        setCurrentTaskId(data.predictionId);
        toast({
          title: "Watermark removal started",
          description: "This may take a few minutes. Check your gallery for the result.",
        });
        return {
          success: true,
          predictionId: data.predictionId,
          mediaId: data.mediaId,
        };
      } else {
        throw new Error(data.error || "Failed to start watermark removal");
      }
    } catch (err) {
      console.error("Watermark removal error:", err);
      toast({
        title: "Watermark removal failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    } finally {
      setIsProcessing(false);
    }
  }, [session?.access_token, canAfford, deductCredits, estimateCreditCost, toast]);

  const checkStatus = useCallback(async (predictionId: string): Promise<{
    status: string;
    videoUrl?: string;
    error?: string;
  }> => {
    if (!session?.access_token) {
      return { status: "error", error: "Not authenticated" };
    }

    try {
      // Use the existing check-kie-video-status function
      const { data, error } = await supabase.functions.invoke("check-kie-video-status", {
        body: { predictionId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      return {
        status: data.status,
        videoUrl: data.videoUrl,
        error: data.error,
      };
    } catch (err) {
      console.error("Status check error:", err);
      return { status: "error", error: err instanceof Error ? err.message : "Unknown error" };
    }
  }, [session?.access_token]);

  const getCost = useCallback(() => {
    return estimateCreditCost("watermarkRemoval");
  }, [estimateCreditCost]);

  return {
    removeWatermark,
    checkStatus,
    isProcessing,
    currentTaskId,
    getCost,
    canAfford: () => canAfford("watermarkRemoval"),
  };
};
