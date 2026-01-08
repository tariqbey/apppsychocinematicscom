import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionStatus {
  subscribed: boolean;
  isTrialing: boolean;
  trialEnd: string | null;
  subscriptionEnd: string | null;
  productId: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    isTrialing: false,
    trialEnd: null,
    subscriptionEnd: null,
    productId: null,
  });
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        subscribed: false,
        isTrialing: false,
        trialEnd: null,
        subscriptionEnd: null,
        productId: null,
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        setLoading(false);
        return;
      }

      setSubscription({
        subscribed: data.subscribed || false,
        isTrialing: data.is_trialing || false,
        trialEnd: data.trial_end || null,
        subscriptionEnd: data.subscription_end || null,
        productId: data.product_id || null,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh subscription status periodically (every 60 seconds)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const startCheckout = async () => {
    if (!user) return;
    
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Failed to start checkout:", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;
    
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Failed to open customer portal:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  return {
    subscription,
    loading,
    checkoutLoading,
    portalLoading,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
  };
};
