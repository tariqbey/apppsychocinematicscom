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

export interface UsagePack {
  id: string;
  dollarAmount: number;
  price: number;
  bonus?: string;
}

export const USAGE_PACKS: UsagePack[] = [
  { id: "pack_5", dollarAmount: 5, price: 5 },
  { id: "pack_10", dollarAmount: 10, price: 10 },
  { id: "pack_20", dollarAmount: 22, price: 20, bonus: "10% bonus" },
  { id: "pack_30", dollarAmount: 35, price: 30, bonus: "17% bonus" },
];

// API costs for generation (in dollars)
export const API_COSTS = {
  video: {
    perSecond: 0.10, // $0.10 per second
  },
  image: {
    "2k": 0.05,
    "4k": 0.08,
    default: 0.05,
  },
  music: {
    default: 0.15,
  },
};

// Markup added to display costs (user-facing price)
export const DISPLAY_MARKUP = 0.10; // $0.10 markup per generation

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
      console.error("Error fetching usage:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch usage");
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
      
      // Refresh usage after allocation
      await fetchCredits();
      return data;
    } catch (err) {
      console.error("Error allocating monthly usage:", err);
      return null;
    }
  }, [session?.access_token, fetchCredits]);

  const deductCredits = useCallback(async (
    mediaType: "video" | "image" | "music",
    duration?: number,
    resolution?: string,
    generationId?: string,
    apiCost?: number
  ) => {
    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("deduct-credits", {
        body: { mediaType, duration, resolution, generationId, apiCost },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (data.success) {
        // Refresh usage after deduction
        await fetchCredits();
      }

      return data;
    } catch (err) {
      console.error("Error deducting usage:", err);
      return { success: false, error: err instanceof Error ? err.message : "Failed to deduct usage" };
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
      console.error("Error purchasing usage:", err);
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
        // Refresh usage after purchase confirmation
        await fetchCredits();
      }

      return data;
    } catch (err) {
      console.error("Error confirming purchase:", err);
      return { success: false, error: err instanceof Error ? err.message : "Failed to confirm purchase" };
    }
  }, [fetchCredits]);

  // Calculate actual API cost for a generation (internal billing)
  const estimateCost = useCallback((
    mediaType: "video" | "image" | "music",
    duration?: number,
    resolution?: string
  ): number => {
    if (mediaType === "video") {
      const durationSeconds = duration || 10;
      return durationSeconds * API_COSTS.video.perSecond;
    } else if (mediaType === "image") {
      const res = resolution?.toLowerCase() || "2k";
      return res.includes("4k") ? API_COSTS.image["4k"] : API_COSTS.image["2k"];
    } else if (mediaType === "music") {
      return API_COSTS.music.default;
    }
    return 0;
  }, []);

  // Calculate display cost for user-facing UI (actual cost + markup)
  const estimateDisplayCost = useCallback((
    mediaType: "video" | "image" | "music",
    duration?: number,
    resolution?: string
  ): number => {
    return estimateCost(mediaType, duration, resolution) + DISPLAY_MARKUP;
  }, [estimateCost]);

  // Check if user can afford a specific generation
  const canAfford = useCallback((
    mediaType: "video" | "image" | "music",
    duration?: number,
    resolution?: string
  ): boolean => {
    if (!credits) return false;
    if (credits.isAdmin) return true;
    const cost = estimateCost(mediaType, duration, resolution);
    return credits.totalRemaining >= cost;
  }, [credits, estimateCost]);

  // Fetch usage on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchCredits();
      // Also try to allocate/reset monthly usage for subscribers
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
    canAfford,
  };
};

// Legacy exports for compatibility
export type ProductionCredits = ProductionUsage;
export const CREDIT_PACKS = USAGE_PACKS;
export const CREDIT_COSTS = API_COSTS;
