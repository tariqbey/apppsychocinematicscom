import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  permission: NotificationPermission | 'unsupported';
  isiOS: boolean;
  isPWA: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const vapidKeyRef = useRef<string | null>(null);
  
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isEnabled: false,
    isLoading: true,
    permission: 'unsupported',
    isiOS: false,
    isPWA: false,
  });

  // Fetch VAPID public key from edge function
  const fetchVapidKey = useCallback(async () => {
    if (vapidKeyRef.current) return vapidKeyRef.current;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error) throw error;
      vapidKeyRef.current = data.publicKey;
      return data.publicKey;
    } catch (error) {
      console.error('[Push] Error fetching VAPID key:', error);
      return null;
    }
  }, []);

  // Check platform and support
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                      (navigator as unknown as { standalone?: boolean }).standalone === true;

    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;

    // On iOS, push only works when running as PWA (installed to home screen)
    const isSupported = hasServiceWorker && hasPushManager && hasNotification && 
                        (!isIOSDevice || isPWAMode);

    const permission = hasNotification ? Notification.permission : 'unsupported';

    setState(prev => ({
      ...prev,
      isSupported,
      isiOS: isIOSDevice,
      isPWA: isPWAMode,
      permission,
      isEnabled: permission === 'granted',
      isLoading: false,
    }));

    // Check existing subscription
    if (isSupported) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
      if (!registration) {
        setState(prev => ({ ...prev, isSubscribed: false }));
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      setState(prev => ({ ...prev, isSubscribed: !!subscription }));
    } catch (error) {
      console.error('[Push] Error checking subscription:', error);
      setState(prev => ({ ...prev, isSubscribed: false }));
    }
  };

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    if (!user) {
      throw new Error('User must be logged in to enable notifications');
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Fetch VAPID key first
      const vapidKey = await fetchVapidKey();
      if (!vapidKey) {
        throw new Error('VAPID public key not configured');
      }

      // Request permission (MUST be triggered by user gesture)
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Unregister old service workers first to ensure clean state
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of existingRegistrations) {
        if (reg.scope.includes('/') && reg.active?.scriptURL.includes('sw-push')) {
          console.log('[Push] Unregistering old service worker');
          await reg.unregister();
        }
      }

      // Register push service worker with cache-busting
      const registration = await navigator.serviceWorker.register('/sw-push.js?v=' + Date.now(), {
        scope: '/'
      });

      console.log('[Push] Service worker registered:', registration);

      // Wait for service worker to be ready and active
      await navigator.serviceWorker.ready;
      
      // Give it a moment to activate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      console.log('[Push] Push subscription created:', subscription.endpoint);

      // Extract keys
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      const auth = btoa(String.fromCharCode(...new Uint8Array(authKey)));

      console.log('[Push] Storing subscription for user:', user.id);

      // Store subscription in database - use insert with explicit conflict handling
      const { data: existingSubscriptions } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        // Update existing subscription
        const { error } = await supabase
          .from('push_subscriptions')
          .update({
            p256dh,
            auth,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscriptions[0].id);

        if (error) {
          console.error('[Push] Error updating subscription:', error);
          throw error;
        }
        console.log('[Push] Updated existing subscription');
      } else {
        // Insert new subscription
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh,
            auth
          });

        if (error) {
          console.error('[Push] Error inserting subscription:', error);
          throw error;
        }
        console.log('[Push] Inserted new subscription');
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          push_notifications_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.warn('[Push] Error updating profile:', profileError);
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        isEnabled: true,
        isLoading: false 
      }));
      
      console.log('[Push] Successfully subscribed to push notifications');

    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.isSupported, user, fetchVapidKey]);

  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
      if (!registration) {
        setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }));
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);

          // Update user profile
          await supabase
            .from('user_profiles')
            .update({ 
              push_notifications_enabled: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        }
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        isEnabled: false,
        isLoading: false 
      }));
      
      console.log('[Push] Successfully unsubscribed from push notifications');

    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [user]);

  // Legacy compatibility methods
  const requestPermission = useCallback(async () => {
    try {
      await subscribe();
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notification reminders.",
      });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to enable notifications';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [subscribe, toast]);

  const disableNotifications = useCallback(async () => {
    try {
      await unsubscribe();
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notification reminders.",
      });
    } catch (error) {
      console.error('[Push] Error disabling:', error);
    }
  }, [unsubscribe, toast]);

  // Show a local notification (for testing)
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!state.isEnabled || state.permission !== 'granted') {
      console.warn("Notifications not enabled");
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });

      return notification;
    } catch (error) {
      console.error("Error showing notification:", error);
      return null;
    }
  }, [state.isEnabled, state.permission]);

  // Schedule a reminder notification (sends via edge function)
  const scheduleReminder = useCallback(async (type: 'journal' | 'ritual' | 'scorecard', delayMinutes: number = 0) => {
    if (!state.isSubscribed || !user) return null;

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
      // For delayed notifications, show local notification after delay
      const timeoutId = setTimeout(() => {
        showNotification(message.title, { body: message.body });
      }, delayMinutes * 60 * 1000);
      
      return timeoutId;
    }
    
    // For immediate notifications, send via edge function
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          payload: {
            title: message.title,
            body: message.body,
            url: type === 'journal' ? '/score' : type === 'ritual' ? '/' : '/score'
          }
        }
      });
      return true;
    } catch (error) {
      console.error('[Push] Error sending notification:', error);
      // Fallback to local notification
      return showNotification(message.title, { body: message.body });
    }
  }, [state.isSubscribed, user, showNotification]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    disableNotifications,
    showNotification,
    scheduleReminder,
  };
}
