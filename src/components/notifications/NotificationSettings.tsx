import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
  compact?: boolean;
}

export function NotificationSettings({ compact = false }: NotificationSettingsProps) {
  const {
    isSupported,
    isEnabled,
    isLoading,
    permission,
    requestPermission,
    disableNotifications,
    scheduleReminder,
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isEnabled) {
      await disableNotifications();
    } else {
      await requestPermission();
    }
  };

  const handleTestNotification = () => {
    scheduleReminder('journal', 0);
  };

  if (!isSupported) {
    if (compact) return null;
    
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="w-5 h-5" />
          <p className="text-sm">Push notifications are not supported in your browser.</p>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <BellRing className="w-5 h-5 text-gold" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="push-notifications" className="cursor-pointer">
              Push Notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              {permission === 'denied' 
                ? 'Blocked in browser settings' 
                : isEnabled 
                  ? 'Enabled' 
                  : 'Receive reminders'}
            </p>
          </div>
        </div>
        <Switch
          id="push-notifications"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading || permission === 'denied'}
        />
      </div>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isEnabled 
            ? "bg-gradient-to-br from-gold to-amber-soft" 
            : "bg-muted"
        )}>
          {isEnabled ? (
            <BellRing className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="font-medium">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {permission === 'denied' 
              ? 'Blocked in browser settings' 
              : isEnabled 
                ? 'You will receive daily reminders' 
                : 'Get reminded to journal and complete rituals'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isLoading ? (
          <Button disabled className="gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </Button>
        ) : permission === 'denied' ? (
          <p className="text-sm text-muted-foreground">
            To enable notifications, update your browser settings for this site.
          </p>
        ) : isEnabled ? (
          <>
            <Button variant="outline" onClick={handleTestNotification}>
              Test Notification
            </Button>
            <Button variant="ghost" onClick={disableNotifications}>
              Disable
            </Button>
          </>
        ) : (
          <Button variant="gold" onClick={requestPermission}>
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </Button>
        )}
      </div>

      {isEnabled && (
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-sm font-medium">Reminder Types</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>🌅</span>
              <span>Morning ritual reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📓</span>
              <span>Daily journaling prompts</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>Evening scorecard check-ins</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
