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

  // Permission denied - show different message
  if (permission === 'denied') {
    return (
      <div className={cn(
        "relative flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30",
        className
      )}>
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

  return (
    <div className={cn(
      "relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gold/10 to-amber-500/10 border border-gold/30",
      className
    )}>
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
  );
}
