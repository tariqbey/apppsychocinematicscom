import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProductionUsage {
  isAdmin: boolean;
  monthlyAllowanceUsed: number;
  monthlyAllowanceLimit: number;
  remainingMonthlyAllowance: number;
  purchasedBalance: number;
  totalRemaining: number;
  monthlyCreditsResetAt?: string;
  canGenerate: boolean;
  usagePercentage: number;
}

export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  bonus?: string;
}

// Credit packs (1 credit = $0.01) - clean $10, $20, $30 blocks
export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_10", credits: 1000, price: 10 },
  { id: "pack_20", credits: 2200, price: 20, bonus: "+200 bonus" },
  { id: "pack_30", credits: 3500, price: 30, bonus: "+500 bonus" },
];

// API costs for generation (in dollars - ACTUAL provider costs)
// These are the real costs we pay to API providers
export const API_COSTS = {
  video: {
    // Model-specific costs per second (actual provider costs)
    "wan-ai/wan2.1-t2v-480p": 0.02,      // $0.02/sec
    "wan-ai/wan2.1-i2v-480p": 0.02,      // $0.02/sec  
    "kling-ai/v1.0/text-to-video": 0.03, // $0.03/sec
    "kling-ai/v1.0/image-to-video": 0.03,// $0.03/sec
    "kling-ai/v1.0/video-to-video": 0.04,// $0.04/sec (editing)
    "google/veo3-fast": 0.05,            // $0.05/sec
    "google/veo3-fast/image-to-video": 0.05, // $0.05/sec
    "google/veo3": 0.10,                 // $0.10/sec (quality)
    "kie-sora-2": 0.015,                 // $0.015/sec (legacy)
    default: 0.02,                       // Fallback to cheapest
  },
  image: {
    "2k": 0.03,      // $0.03 per 2K image (actual)
    "4k": 0.05,      // $0.05 per 4K image (actual)
    default: 0.03,
  },
  music: {
    default: 0.12,   // $0.12 per song generation (actual Suno cost)
  },
  tts: {
    default: 0.02,   // $0.02 per TTS request
    perChar: 0.00002, // $0.02 per 1000 characters
  },
  voiceChange: {
    default: 0.05,   // $0.05 per voice change
  },
  ai: {
    default: 0.01,   // $0.01 per AI chat/suggestion
  },
};

// Markup added to display costs (user-facing price) in dollars
export const DISPLAY_MARKUP = 0.10; // $0.10 markup per generation

// Conversion helpers
export const dollarsToCredits = (dollars: number): number => Math.round(dollars * 100);
export const creditsToDollars = (credits: number): number => credits / 100;

// Legacy export for compatibility
export const USAGE_PACKS = CREDIT_PACKS.map(pack => ({
  id: pack.id,
  dollarAmount: creditsToDollars(pack.credits),
  price: pack.price,
  bonus: pack.bonus,
}));

export const useProductionCredits = () => {
  const { user, session } = useAuth();
  const [credits, setCredits] = useState<ProductionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!session?.access_token) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke("check-credits", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      
      setCredits(data as ProductionUsage);
    } catch (err) {
      console.error("Error fetching credits:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch credits");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const allocateMonthlyCredits = useCallback(async () => {
    if (!session?.access_token) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke("allocate-monthly-credits", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      
      // Refresh after allocation
      await fetchCredits();
      return data;
    } catch (err) {
      console.error("Error allocating monthly credits:", err);
      return null;
    }
  }, [session?.access_token, fetchCredits]);

  const deductCredits = useCallback(async (
    mediaType: "video" | "image" | "music" | "tts" | "voiceChange" | "ai",
    duration?: number,
    resolution?: string,
    generationId?: string,
    apiCost?: number,
    model?: string // NEW: model parameter for model-specific pricing
  ) => {
    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("deduct-credits", {
        body: { mediaType, duration, resolution, generationId, apiCost, model },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (data.success) {
        // Refresh credits after deduction
        await fetchCredits();
      }

      return data;
    } catch (err) {
      console.error("Error deducting credits:", err);
      return { success: false, error: err instanceof Error ? err.message : "Failed to deduct credits" };
    }
  }, [session?.access_token, fetchCredits]);

  const purchaseCredits = useCallback(async (packId: string) => {
    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("purchase-credits", {
        body: { packId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (data.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, "_blank");
        return { success: true, url: data.url };
      }

      return { success: false, error: "No checkout URL returned" };
    } catch (err) {
      console.error("Error purchasing credits:", err);
      return { success: false, error: err instanceof Error ? err.message : "Failed to start purchase" };
    }
  }, [session?.access_token]);

  const confirmPurchase = useCallback(async (sessionId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("confirm-credit-purchase", {
        body: { sessionId },
      });

      if (fnError) throw fnError;

      if (data.success) {
        // Refresh credits after purchase confirmation
        await fetchCredits();
      }

      return data;
    } catch (err) {
      console.error("Error confirming purchase:", err);
      return { success: false, error: err instanceof Error ? err.message : "Failed to confirm purchase" };
    }
  }, [fetchCredits]);

  // Calculate actual API cost for a generation (in dollars - internal)
  const estimateCost = useCallback((
    mediaType: "video" | "image" | "music" | "tts" | "voiceChange" | "ai",
    duration?: number,
    resolution?: string,
    model?: string // NEW: model parameter for model-specific video pricing
  ): number => {
    if (mediaType === "video") {
      const durationSeconds = duration || 10;
      // Use model-specific cost or fallback to default
      const videoCosts = API_COSTS.video as Record<string, number>;
      const perSecondCost = model && videoCosts[model] ? videoCosts[model] : videoCosts.default;
      return durationSeconds * perSecondCost;
    } else if (mediaType === "image") {
      const res = resolution?.toLowerCase() || "2k";
      return res.includes("4k") ? API_COSTS.image["4k"] : API_COSTS.image["2k"];
    } else if (mediaType === "music") {
      return API_COSTS.music.default;
    } else if (mediaType === "tts") {
      return API_COSTS.tts.default;
    } else if (mediaType === "voiceChange") {
      return API_COSTS.voiceChange.default;
    } else if (mediaType === "ai") {
      return API_COSTS.ai.default;
    }
    return 0;
  }, []);

  // Calculate cost with markup (in dollars - for display conversion)
  const estimateCostWithMarkup = useCallback((
    mediaType: "video" | "image" | "music" | "tts" | "voiceChange" | "ai",
    duration?: number,
    resolution?: string,
    model?: string
  ): number => {
    return estimateCost(mediaType, duration, resolution, model) + DISPLAY_MARKUP;
  }, [estimateCost]);

  // Calculate display cost in CREDITS (what user sees and pays)
  const estimateCreditCost = useCallback((
    mediaType: "video" | "image" | "music" | "tts" | "voiceChange" | "ai",
    duration?: number,
    resolution?: string,
    model?: string // NEW: model parameter for model-specific video pricing
  ): number => {
    const costWithMarkup = estimateCostWithMarkup(mediaType, duration, resolution, model);
    return dollarsToCredits(costWithMarkup);
  }, [estimateCostWithMarkup]);

  // Legacy: estimate display cost in dollars (for backward compatibility)
  const estimateDisplayCost = useCallback((
    mediaType: "video" | "image" | "music" | "tts" | "voiceChange" | "ai",
    duration?: number,
    resolution?: string,
    model?: string
  ): number => {
    return estimateCostWithMarkup(mediaType, duration, resolution, model);
  }, [estimateCostWithMarkup]);

  // Check if user can afford a specific generation (in credits)
  const canAfford = useCallback((
    mediaType: "video" | "image" | "music" | "tts" | "voiceChange" | "ai",
    duration?: number,
    resolution?: string,
    model?: string
  ): boolean => {
    if (!credits) return false;
    if (credits.isAdmin) return true;
    const creditCost = estimateCreditCost(mediaType, duration, resolution, model);
    return credits.totalRemaining >= creditCost;
  }, [credits, estimateCreditCost]);

  // Fetch credits on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchCredits();
      // Also try to allocate/reset monthly credits for subscribers
      allocateMonthlyCredits();
    } else {
      setCredits(null);
      setLoading(false);
    }
  }, [user, fetchCredits, allocateMonthlyCredits]);

  return {
    credits,
    loading,
    error,
    fetchCredits,
    deductCredits,
    purchaseCredits,
    confirmPurchase,
    allocateMonthlyCredits,
    estimateCost,
    estimateDisplayCost,
    estimateCreditCost,
    canAfford,
    dollarsToCredits,
    creditsToDollars,
  };
};

// Legacy exports for compatibility
export type ProductionCredits = ProductionUsage;
export const CREDIT_COSTS = API_COSTS;
