import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProductionCredits {
  isAdmin: boolean;
  monthlyCredits: number;
  purchasedCredits: number;
  totalCredits: number;
  monthlyCreditsResetAt?: string;
  canGenerate: boolean;
}

export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_20", credits: 20, price: 12, pricePerCredit: 0.60 },
  { id: "pack_40", credits: 40, price: 24, pricePerCredit: 0.60 },
  { id: "pack_60", credits: 60, price: 36, pricePerCredit: 0.60 },
  { id: "pack_100", credits: 100, price: 60, pricePerCredit: 0.60 },
];

// Credit costs for generation
export const CREDIT_COSTS = {
  video: {
    // 1 credit per 10 seconds
    calculate: (durationSeconds: number) => (durationSeconds / 10),
  },
  image: {
    "2k": 0.18,
    "4k": 0.24,
    default: 0.18,
  },
};

export const useProductionCredits = () => {
  const { user, session } = useAuth();
  const [credits, setCredits] = useState<ProductionCredits | null>(null);
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
      
      setCredits(data as ProductionCredits);
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
      
      // Refresh credits after allocation
      await fetchCredits();
      return data;
    } catch (err) {
      console.error("Error allocating credits:", err);
      return null;
    }
  }, [session?.access_token, fetchCredits]);

  const deductCredits = useCallback(async (
    mediaType: "video" | "image",
    duration?: number,
    resolution?: string,
    generationId?: string
  ) => {
    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("deduct-credits", {
        body: { mediaType, duration, resolution, generationId },
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

  // Fetch credits on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchCredits();
      // Also try to allocate monthly credits for subscribers
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
  };
};
