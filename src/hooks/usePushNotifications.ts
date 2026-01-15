import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PushSubscriptionState {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  permission: NotificationPermission | 'unsupported';
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isEnabled: false,
    isLoading: true,
    permission: 'unsupported',
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    const permission = isSupported ? Notification.permission : 'unsupported';
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission,
      isEnabled: permission === 'granted',
      isLoading: false,
    }));
    
    return isSupported;
  }, []);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser.",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isEnabled: permission === 'granted',
        isLoading: false,
      }));

      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notification reminders.",
        });
        
        // Store preference in user profile
        if (user) {
          await supabase
            .from('user_profiles')
            .update({ 
              push_notifications_enabled: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        }
        
        return true;
      } else if (permission === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "You've blocked notifications. Enable them in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Error",
        description: "Failed to enable notifications.",
        variant: "destructive",
      });
      return false;
    }
  }, [state.isSupported, user, toast]);

  // Show a local notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!state.isEnabled) {
      console.warn("Notifications not enabled");
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        ...options,
      });

      return notification;
    } catch (error) {
      console.error("Error showing notification:", error);
      return null;
    }
  }, [state.isEnabled]);

  // Schedule a reminder notification
  const scheduleReminder = useCallback((type: 'journal' | 'ritual' | 'scorecard', delayMinutes: number = 0) => {
    if (!state.isEnabled) return null;

    const messages = {
      journal: {
        title: "📓 Time to Journal",
        body: "Take a moment to record your thoughts and experiences, Director.",
      },
      ritual: {
        title: "🎬 Morning Ritual",
        body: "Start your day with your Mind Movie screening.",
      },
      scorecard: {
        title: "📊 Evening Check-in",
        body: "Complete your Daily Director Scorecard before bed.",
      },
    };

    const message = messages[type];
    
    if (delayMinutes > 0) {
      const timeoutId = setTimeout(() => {
        showNotification(message.title, { body: message.body });
      }, delayMinutes * 60 * 1000);
      
      return timeoutId;
    }
    
    return showNotification(message.title, { body: message.body });
  }, [state.isEnabled, showNotification]);

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ 
          push_notifications_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }
    
    setState(prev => ({ ...prev, isEnabled: false }));
    
    toast({
      title: "Notifications Disabled",
      description: "You won't receive push notification reminders.",
    });
  }, [user, toast]);

  return {
    ...state,
    requestPermission,
    showNotification,
    scheduleReminder,
    disableNotifications,
  };
}
