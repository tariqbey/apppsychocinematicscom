import { useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
  compact?: boolean;
}

export function NotificationSettings({ compact = false }: NotificationSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    isEnabled,
    isLoading,
    permission,
    isiOS,
    isPWA,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast({ title: "Notifications disabled" });
      } else {
        await subscribe();
        toast({ title: "Notifications enabled!" });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSendTest = async () => {
    if (!user) return;
    
    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          payload: {
            title: "🎬 Test Notification",
            body: "Push notifications are working, Director!",
            url: "/"
          }
        }
      });

      if (error) throw error;
      toast({ title: "Test notification sent!" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send test';
      toast({ 
        title: "Failed to send test", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // iOS not in PWA mode - show install instructions
  if (isiOS && !isPWA) {
    if (compact) {
      return (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Smartphone className="w-5 h-5" />
          <div>
            <Label>Push Notifications</Label>
            <p className="text-xs">Install app for notifications</p>
          </div>
        </div>
      );
    }

    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-gold">Install the app first</p>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">To enable push notifications on iOS:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Tap the <strong>Share</strong> button in Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Open the app from your home screen</li>
          </ol>
        </div>
      </Card>
    );
  }

  // Not supported
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

  // Permission denied
  if (permission === 'denied') {
    if (compact) {
      return (
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <Label>Push Notifications</Label>
            <p className="text-xs">Blocked in browser settings</p>
          </div>
        </div>
      );
    }

    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-destructive">Permission denied</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          To enable notifications, update your browser settings for this site.
        </p>
      </Card>
    );
  }

  // Compact view
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <BellRing className="w-5 h-5 text-gold" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="push-notifications" className="cursor-pointer">
              Push Notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? 'Enabled' : 'Receive reminders'}
            </p>
          </div>
        </div>
        <Switch
          id="push-notifications"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>
    );
  }

  // Full view
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isSubscribed 
            ? "bg-gradient-to-br from-gold to-amber-soft" 
            : "bg-muted"
        )}>
          {isSubscribed ? (
            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="font-medium">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {isSubscribed 
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
        ) : isSubscribed ? (
          <>
            <Button 
              variant="outline" 
              onClick={handleSendTest}
              disabled={isSendingTest}
            >
              {isSendingTest ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Test Notification
            </Button>
            <Button variant="ghost" onClick={() => unsubscribe()}>
              Disable
            </Button>
          </>
        ) : (
          <Button variant="gold" onClick={() => subscribe()}>
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </Button>
        )}
      </div>

      {isSubscribed && (
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
