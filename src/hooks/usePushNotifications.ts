import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Extend ServiceWorkerRegistration to include pushManager for environments that support it
declare global {
  interface ServiceWorkerRegistration {
    pushManager: PushManager;
  }
}

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
  activeServiceWorker: string | null;
  currentEndpoint: string | null;
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
    activeServiceWorker: null,
    currentEndpoint: null,
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

  // Get the unified service worker registration
  const getServiceWorkerRegistration = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;
    
    try {
      // Wait for service worker to be ready first
      await navigator.serviceWorker.ready;
      
      // Get registration by SCOPE (correct method for iOS)
      let registration = await navigator.serviceWorker.getRegistration('/');
      
      if (!registration) {
        // Register the unified SW if not present
        console.log('[Push] No SW found, registering unified sw.js...');
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        
        // Wait for activation
        await new Promise<void>((resolve) => {
          if (registration!.active) {
            resolve();
          } else {
            const sw = registration!.installing || registration!.waiting;
            if (sw) {
              sw.addEventListener('statechange', function listener() {
                if (sw.state === 'activated') {
                  sw.removeEventListener('statechange', listener);
                  resolve();
                }
              });
            } else {
              resolve();
            }
          }
        });
      }
      
      console.log('[Push] Active SW:', registration.active?.scriptURL);
      return registration;
    } catch (error) {
      console.error('[Push] SW registration error:', error);
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
      const registration = await getServiceWorkerRegistration();
      
      if (!registration) {
        console.log('[Push] No service worker registration found');
        setState(prev => ({ ...prev, isSubscribed: false, activeServiceWorker: null, currentEndpoint: null }));
        return;
      }

      console.log('[Push] Found registration:', registration.scope, 'active:', !!registration.active);
      
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint || null;
      
      console.log('[Push] Current subscription endpoint:', endpoint?.substring(0, 60) || 'none');
      
      setState(prev => ({ 
        ...prev, 
        isSubscribed: !!subscription,
        activeServiceWorker: registration.active?.scriptURL || null,
        currentEndpoint: endpoint
      }));
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

      // Get the unified service worker
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        throw new Error('Service worker registration failed');
      }

      console.log('[Push] Using service worker:', registration.active?.scriptURL);

      // Unsubscribe from any existing subscription first (clean slate for this device)
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        console.log('[Push] Unsubscribing from old subscription...');
        await existingSub.unsubscribe();
      }

      // Subscribe to push with the VAPID key
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      console.log('[Push] New subscription created:', subscription.endpoint.substring(0, 60) + '...');
      console.log('[Push] Endpoint type:', subscription.endpoint.includes('apple') ? 'APNS (iOS)' : 
                  subscription.endpoint.includes('fcm') ? 'FCM (Android/Chrome)' : 'Web Push');

      // Extract keys
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      const auth = btoa(String.fromCharCode(...new Uint8Array(authKey)));

      // Store subscription in database - use upsert based on endpoint
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });

      if (dbError) {
        console.error('[Push] Error saving subscription:', dbError);
        throw new Error('Failed to save subscription');
      }

      console.log('[Push] Subscription saved to database');

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({ 
          push_notifications_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        isEnabled: true,
        isLoading: false,
        activeServiceWorker: registration.active?.scriptURL || null,
        currentEndpoint: subscription.endpoint
      }));
      
      console.log('[Push] Successfully subscribed to push notifications');

    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.isSupported, user, fetchVapidKey, getServiceWorkerRegistration]);

  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }));
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Remove from database first
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
        }

        await subscription.unsubscribe();
      }

      // Update user profile
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ 
            push_notifications_enabled: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        isEnabled: false,
        isLoading: false,
        currentEndpoint: null
      }));
      
      console.log('[Push] Successfully unsubscribed from push notifications');

    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [user, getServiceWorkerRegistration]);

  // Re-register device (force new subscription)
  const reRegisterDevice = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please sign in to enable notifications.",
        variant: "destructive"
      });
      return false;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('[Push] Starting device re-registration...');
      
      // 1. First, remove existing subscriptions from DB for this user (clean slate)
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.warn('[Push] Could not clean old subscriptions:', deleteError);
      } else {
        console.log('[Push] Cleaned old subscriptions from DB');
      }
      
      // 2. Unregister ALL service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        console.log('[Push] Unregistering SW:', reg.active?.scriptURL);
        // Also unsubscribe from push if possible
        try {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
            console.log('[Push] Unsubscribed from push on old SW');
          }
        } catch (e) {
          console.warn('[Push] Could not unsubscribe from old SW:', e);
        }
        await reg.unregister();
      }
      
      // 3. Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 4. Register fresh SW with cache bust
      console.log('[Push] Registering fresh service worker...');
      const newReg = await navigator.serviceWorker.register('/sw.js?v=' + Date.now(), { scope: '/' });
      
      // 5. Wait for activation
      await new Promise<void>((resolve) => {
        if (newReg.active) {
          resolve();
        } else {
          const sw = newReg.installing || newReg.waiting;
          if (sw) {
            sw.addEventListener('statechange', function listener() {
              if (sw.state === 'activated') {
                sw.removeEventListener('statechange', listener);
                resolve();
              }
            });
          } else {
            resolve();
          }
        }
      });
      
      console.log('[Push] Fresh SW activated:', newReg.active?.scriptURL);
      
      // 6. Small delay to ensure browser is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 7. Now subscribe
      await subscribe();
      
      toast({
        title: "Device Re-registered",
        description: "Push notifications should now work. Test it!",
      });
      
      return true;
    } catch (error) {
      console.error('[Push] Re-register error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Re-registration Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return false;
    }
  }, [user, subscribe, toast]);

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

  // Send test notification to THIS device only
  const sendTestNotification = useCallback(async () => {
    if (!user) {
      toast({
        title: "Cannot Send Test",
        description: "Not logged in",
        variant: "destructive"
      });
      return false;
    }

    // If we don't have the current endpoint in state, try to get it
    let endpoint = state.currentEndpoint;
    if (!endpoint) {
      console.log('[Push] No endpoint in state, checking subscription...');
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          endpoint = subscription?.endpoint || null;
          console.log('[Push] Found endpoint from browser:', endpoint?.substring(0, 50));
        }
      } catch (e) {
        console.warn('[Push] Could not check subscription:', e);
      }
    }

    if (!endpoint) {
      toast({
        title: "No Subscription",
        description: "Enable notifications first, or try 'Repair Push'.",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log('[Push] Sending test to endpoint:', endpoint.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          payload: {
            title: '🎬 Test Notification',
            body: 'Push notifications are working on this device!',
            url: '/'
          },
          targetEndpoint: endpoint
        }
      });

      if (error) {
        console.error('[Push] Test notification error:', error);
        toast({
          title: "Test Failed",
          description: error.message || "Edge function error",
          variant: "destructive"
        });
        return false;
      }

      console.log('[Push] Test notification response:', data);
      
      if (data?.sent === 0) {
        toast({
          title: "Subscription Not Found",
          description: data.errors?.[0] || "No matching subscription in database. Try 'Repair Push'.",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Test Sent",
        description: `Notification sent! Check your device. (${data?.sent || 0} delivered)`
      });
      return true;
    } catch (error) {
      console.error('[Push] Test notification error:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return false;
    }
  }, [user, state.currentEndpoint, toast]);

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
      return showNotification(message.title, { body: message.body });
    }
  }, [state.isSubscribed, user, showNotification]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reRegisterDevice,
    requestPermission,
    disableNotifications,
    showNotification,
    sendTestNotification,
    scheduleReminder,
    checkSubscription,
  };
}
