import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SubscriptionStatus {
  subscribed: boolean;
  isAdmin: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  status?: string;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      
      setSubscription(data as SubscriptionStatus);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to check subscription");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const createSubscription = useCallback(async () => {
    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (data.error) {
        return { success: false, error: data.error, hasActiveSubscription: data.hasActiveSubscription };
      }

      if (data.url) {
        window.open(data.url, "_blank");
        return { success: true, url: data.url };
      }

      return { success: false, error: "No checkout URL returned" };
    } catch (err) {
      console.error("Error creating subscription:", err);
      return { success: false, error: err instanceof Error ? err.message : "Failed to start subscription" };
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user, checkSubscription]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    createSubscription,
    isSubscribed: subscription?.subscribed || subscription?.isAdmin || false,
    isAdmin: subscription?.isAdmin || false,
  };
};
