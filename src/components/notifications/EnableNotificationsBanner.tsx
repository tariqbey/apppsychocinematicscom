import { useState, useEffect } from "react";
import { Bell, BellRing, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface EnableNotificationsBannerProps {
  className?: string;
  dismissible?: boolean;
}

export function EnableNotificationsBanner({ 
  className,
  dismissible = true 
}: EnableNotificationsBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const { 
    isSubscribed, 
    isSupported, 
    permission,
    isiOS,
    isPWA,
    subscribe 
  } = usePushNotifications();

  // Check if banner was dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('notification_banner_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Don't show if already subscribed, dismissed, or not supported
  if (isSubscribed || isDismissed) {
    return null;
  }

  // Special case: iOS not in PWA mode
  if (isiOS && !isPWA) {
    return null; // Handle this in NotificationSettings instead
  }

  // Detect if user needs desktop browser instructions
  const isDesktopBrowser = typeof window !== 'undefined' && 
    !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Permission denied - show different message with unblock instructions
  if (permission === 'denied') {
    return (
      <div className={cn(
        "relative flex flex-col gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Notifications Blocked</p>
            <p className="text-xs text-muted-foreground">
              Update your browser settings to enable reminders for your daily rituals.
            </p>
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => {
                sessionStorage.setItem('notification_banner_dismissed', 'true');
                setIsDismissed(true);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Unblock instructions for desktop */}
        {isDesktopBrowser && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">How to unblock notifications:</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <p className="font-medium">Mac (Safari/Chrome):</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>Click the lock icon in the address bar</li>
                  <li>Find "Notifications" and change to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
              <div>
                <p className="font-medium">Windows (Chrome/Edge):</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>Click the lock/info icon in the address bar</li>
                  <li>Click "Site settings"</li>
                  <li>Set "Notifications" to "Allow" and refresh</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      await subscribe();
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('notification_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  // Detect if user needs desktop browser instructions
  const isDesktop = typeof window !== 'undefined' && 
    !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className={cn(
      "relative flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-r from-gold/10 to-amber-500/10 border border-gold/30",
      className
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center shrink-0">
          <BellRing className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gold">Enable Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            Get daily reminders to stay in character, complete your Three Things, and journal your journey.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="gold"
            size="sm"
            className="flex-1 sm:flex-none gap-2"
            onClick={handleEnable}
            disabled={isEnabling}
          >
            {isEnabling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Enable Now
          </Button>
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleDismiss}
            >
              Later
            </Button>
          )}
        </div>
      </div>
      
      {/* Desktop browser instructions */}
      {isDesktop && permission !== 'granted' && (
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">If you don't see a notification prompt:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <p className="font-medium text-gold">Mac (Safari/Chrome):</p>
              <ol className="list-decimal list-inside space-y-0.5 pl-1">
                <li>Click the lock icon in the address bar</li>
                <li>Find "Notifications" and set to "Allow"</li>
                <li>Refresh the page and click "Enable Now"</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-gold">Windows (Chrome/Edge):</p>
              <ol className="list-decimal list-inside space-y-0.5 pl-1">
                <li>Click the lock/info icon in the address bar</li>
                <li>Click "Site settings"</li>
                <li>Set "Notifications" to "Allow"</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
