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

  // Recursively list all files in a bucket folder
  const listAllFiles = async (bucket: string, path: string): Promise<number> => {
    let totalSize = 0;
    
    try {
      const { data: items } = await supabase.storage
        .from(bucket)
        .list(path, { limit: 1000 });

      if (!items) return 0;

      for (const item of items) {
        if (item.id === null) {
          // This is a folder, recurse into it
          const subPath = path ? `${path}/${item.name}` : item.name;
          totalSize += await listAllFiles(bucket, subPath);
        } else if (item.metadata?.size) {
          // This is a file with size metadata
          totalSize += item.metadata.size;
        }
      }
    } catch (err) {
      console.warn(`Error listing ${bucket}/${path}:`, err);
    }

    return totalSize;
  };

  const calculateUsage = useCallback(async () => {
    if (!user) return null;

    setIsLoading(true);
    try {
      // Recursively calculate storage for both buckets
      const [mindMoviesSize, generatedMediaSize] = await Promise.all([
        listAllFiles("mind-movies", user.id),
        listAllFiles("generated-media", user.id),
      ]);

      const totalBytes = mindMoviesSize + generatedMediaSize;

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
