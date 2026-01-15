import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface StorageUsage {
  totalBytes: number;
  totalMB: number;
  totalGB: number;
  percentUsed: number;
  limitGB: number;
}

const STORAGE_LIMIT_GB = 10;
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 * 1024 * 1024;

export function useStorageUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateUsage = useCallback(async () => {
    if (!user) return null;

    setIsLoading(true);
    try {
      let totalBytes = 0;

      // Check mind-movies bucket
      const { data: mindMovies } = await supabase.storage
        .from("mind-movies")
        .list(user.id, { limit: 1000 });

      if (mindMovies) {
        for (const file of mindMovies) {
          if (file.metadata?.size) {
            totalBytes += file.metadata.size;
          }
        }
      }

      // Check generated-media bucket
      const { data: generatedMedia } = await supabase.storage
        .from("generated-media")
        .list(user.id, { limit: 1000 });

      if (generatedMedia) {
        for (const file of generatedMedia) {
          if (file.metadata?.size) {
            totalBytes += file.metadata.size;
          }
        }
      }

      const totalMB = totalBytes / (1024 * 1024);
      const totalGB = totalBytes / (1024 * 1024 * 1024);
      const percentUsed = (totalBytes / STORAGE_LIMIT_BYTES) * 100;

      const usageData: StorageUsage = {
        totalBytes,
        totalMB,
        totalGB,
        percentUsed: Math.min(percentUsed, 100),
        limitGB: STORAGE_LIMIT_GB,
      };

      setUsage(usageData);
      return usageData;
    } catch (error) {
      console.error("Error calculating storage usage:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const formatUsage = useCallback((bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }, []);

  return {
    usage,
    isLoading,
    calculateUsage,
    formatUsage,
    STORAGE_LIMIT_GB,
  };
}
