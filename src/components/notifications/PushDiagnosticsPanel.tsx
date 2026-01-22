import { useState } from "react";
import { 
  Activity, 
  Bell, 
  BellOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  Smartphone,
  Globe,
  Key,
  Wrench
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function PushDiagnosticsPanel() {
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    isEnabled,
    isLoading,
    permission,
    isiOS,
    isPWA,
    activeServiceWorker,
    currentEndpoint,
    reRegisterDevice,
    sendTestNotification,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  
  const [isRepairing, setIsRepairing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      const success = await reRegisterDevice();
      if (success) {
        toast({
          title: "Push Repaired",
          description: "Device re-registered successfully. Try the test notification.",
        });
      }
    } finally {
      setIsRepairing(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await sendTestNotification();
    } finally {
      setIsTesting(false);
    }
  };

  const getPermissionColor = () => {
    switch (permission) {
      case 'granted': return 'text-green-500';
      case 'denied': return 'text-destructive';
      case 'default': return 'text-amber-500';
      default: return 'text-muted-foreground';
    }
  };

  const getEndpointType = () => {
    if (!currentEndpoint) return 'None';
    if (currentEndpoint.includes('apple') || currentEndpoint.includes('apns')) return 'APNS (iOS)';
    if (currentEndpoint.includes('fcm') || currentEndpoint.includes('google')) return 'FCM (Android/Chrome)';
    if (currentEndpoint.includes('mozilla')) return 'Mozilla Push';
    return 'Web Push';
  };

  const shortenEndpoint = (endpoint: string | null) => {
    if (!endpoint) return 'Not subscribed';
    return endpoint.substring(0, 50) + '...';
  };

  // Not supported at all
  if (!isSupported) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Push Diagnostics
          </CardTitle>
          <CardDescription>Technical details for debugging push notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <BellOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Not Supported</p>
              <p className="text-sm text-muted-foreground">
                {isiOS && !isPWA 
                  ? "Install this app to your Home Screen first (Safari → Share → Add to Home Screen)"
                  : "Your browser doesn't support push notifications"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Push Diagnostics
        </CardTitle>
        <CardDescription>Technical details for debugging push notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Permission Status */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Key className="h-3 w-3" />
              Permission
            </div>
            <div className={cn("font-medium capitalize", getPermissionColor())}>
              {permission}
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bell className="h-3 w-3" />
              Subscription
            </div>
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-500">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-amber-500">Inactive</span>
                </>
              )}
            </div>
          </div>

          {/* Platform */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="h-3 w-3" />
              Platform
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{isiOS ? 'iOS' : 'Other'}</span>
              {isPWA && (
                <Badge variant="outline" className="text-xs">PWA</Badge>
              )}
            </div>
          </div>

          {/* Endpoint Type */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              Endpoint
            </div>
            <div className="font-medium">{getEndpointType()}</div>
          </div>
        </div>

        {/* Service Worker Info */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <div className="text-xs text-muted-foreground">Active Service Worker</div>
          <code className="text-xs font-mono text-foreground break-all">
            {activeServiceWorker || 'None registered'}
          </code>
        </div>

        {/* Endpoint Details */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <div className="text-xs text-muted-foreground">Subscription Endpoint</div>
          <code className="text-xs font-mono text-foreground break-all">
            {shortenEndpoint(currentEndpoint)}
          </code>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isSubscribed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTesting || isLoading}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Test Notification
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepair}
                disabled={isRepairing || isLoading}
                className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              >
                {isRepairing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                Repair Push
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => unsubscribe()}
                disabled={isLoading}
              >
                Disable
              </Button>
            </>
          ) : (
            <Button
              variant="gold"
              size="sm"
              onClick={() => subscribe()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Enable Notifications
            </Button>
          )}
        </div>

        {/* iOS PWA Notice */}
        {isiOS && isPWA && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
            <p className="text-blue-400">
              <strong>iOS PWA:</strong> If notifications stop working, use "Repair Push" to re-register this device.
            </p>
          </div>
        )}

        {/* Permission Denied Help */}
        {permission === 'denied' && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm space-y-2">
            <p className="text-destructive font-medium">Permission Blocked</p>
            <p className="text-muted-foreground">
              To unblock notifications, go to your browser settings:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Chrome:</strong> Settings → Privacy → Site Settings → Notifications</li>
              <li><strong>Safari (Mac):</strong> Preferences → Websites → Notifications</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Notifications</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
