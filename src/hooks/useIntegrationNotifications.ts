import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

type NotificationChannel = "slack" | "telegram" | "all";
type NotificationType = "journal_reminder" | "morning_ritual" | "evening_scorecard" | "achievement" | "custom";

interface UseIntegrationNotificationsReturn {
  sendNotification: (
    channel: NotificationChannel,
    type: NotificationType,
    title: string,
    message: string
  ) => Promise<boolean>;
  syncToNotion: (
    type: "journal" | "scorecard" | "chief_aim",
    entryId?: string
  ) => Promise<boolean>;
  postToSocial: (
    platform: "facebook" | "twitter" | "instagram" | "tiktok",
    content: string,
    mediaUrl?: string
  ) => Promise<{ success: boolean; postId?: string; manualPost?: boolean; content?: string }>;
  isSending: boolean;
  isSyncing: boolean;
  isPosting: boolean;
}

export function useIntegrationNotifications(): UseIntegrationNotificationsReturn {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const sendNotification = useCallback(
    async (
      channel: NotificationChannel,
      type: NotificationType,
      title: string,
      message: string
    ): Promise<boolean> => {
      if (!user) return false;

      setIsSending(true);
      try {
        const { data, error } = await supabase.functions.invoke("send-notification", {
          body: { channel, type, title, message },
        });

        if (error) throw error;

        if (data?.success) {
          const results = data.results || {};
          const channels = Object.entries(results)
            .filter(([_, sent]) => sent)
            .map(([ch]) => ch);
          
          if (channels.length > 0) {
            toast.success(`Notification sent via ${channels.join(" & ")}`);
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("Send notification error:", error);
        toast.error("Failed to send notification");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [user]
  );

  const syncToNotion = useCallback(
    async (type: "journal" | "scorecard" | "chief_aim", entryId?: string): Promise<boolean> => {
      if (!user) return false;

      setIsSyncing(true);
      try {
        const { data, error } = await supabase.functions.invoke("notion-sync", {
          body: { type, entryId },
        });

        if (error) throw error;

        if (data?.success) {
          toast.success(`Synced to Notion successfully`);
          return true;
        } else {
          toast.error(data?.error || "Failed to sync to Notion");
          return false;
        }
      } catch (error) {
        console.error("Notion sync error:", error);
        toast.error("Failed to sync to Notion");
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [user]
  );

  const postToSocial = useCallback(
    async (
      platform: "facebook" | "twitter" | "instagram" | "tiktok",
      content: string,
      mediaUrl?: string
    ): Promise<{ success: boolean; postId?: string; manualPost?: boolean; content?: string }> => {
      if (!user) return { success: false };

      setIsPosting(true);
      try {
        const { data, error } = await supabase.functions.invoke("social-post", {
          body: { platform, content, mediaUrl },
        });

        if (error) throw error;

        if (data?.success) {
          toast.success(`Posted to ${platform} successfully!`);
          return { success: true, postId: data.postId };
        } else if (data?.manualPost) {
          // Platform requires manual posting
          return { success: false, manualPost: true, content: data.content };
        } else {
          toast.error(data?.error || `Failed to post to ${platform}`);
          return { success: false };
        }
      } catch (error) {
        console.error("Social post error:", error);
        toast.error(`Failed to post to ${platform}`);
        return { success: false };
      } finally {
        setIsPosting(false);
      }
    },
    [user]
  );

  return {
    sendNotification,
    syncToNotion,
    postToSocial,
    isSending,
    isSyncing,
    isPosting,
  };
}
