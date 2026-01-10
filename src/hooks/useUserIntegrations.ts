import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface UserIntegration {
  id: string;
  user_id: string;
  service_name: string;
  api_key: string | null;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export function useUserIntegrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    if (!user?.id) {
      setIntegrations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setIntegrations((data as UserIntegration[]) || []);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const getIntegration = useCallback(
    (serviceName: string): UserIntegration | undefined => {
      return integrations.find((i) => i.service_name === serviceName);
    },
    [integrations]
  );

  const saveIntegration = useCallback(
    async (serviceName: string, apiKey: string | null, settings?: Json) => {
      if (!user?.id) {
        toast.error("Please sign in to save integrations");
        return false;
      }

      try {
        const existing = integrations.find((i) => i.service_name === serviceName);

        if (existing) {
          const { error } = await supabase
            .from("user_integrations")
            .update({
              api_key: apiKey,
              settings: settings || existing.settings,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("user_integrations").insert({
            user_id: user.id,
            service_name: serviceName,
            api_key: apiKey,
            settings: settings || {},
          });

          if (error) throw error;
        }

        await fetchIntegrations();
        toast.success(`${serviceName} integration saved`);
        return true;
      } catch (error) {
        console.error("Failed to save integration:", error);
        toast.error("Failed to save integration");
        return false;
      }
    },
    [user?.id, integrations, fetchIntegrations]
  );

  const deleteIntegration = useCallback(
    async (serviceName: string) => {
      if (!user?.id) return false;

      try {
        const { error } = await supabase
          .from("user_integrations")
          .delete()
          .eq("user_id", user.id)
          .eq("service_name", serviceName);

        if (error) throw error;

        await fetchIntegrations();
        toast.success(`${serviceName} integration removed`);
        return true;
      } catch (error) {
        console.error("Failed to delete integration:", error);
        toast.error("Failed to remove integration");
        return false;
      }
    },
    [user?.id, fetchIntegrations]
  );

  return {
    integrations,
    loading,
    getIntegration,
    saveIntegration,
    deleteIntegration,
    refresh: fetchIntegrations,
  };
}
