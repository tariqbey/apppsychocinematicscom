import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log("[PWA] Service worker registered:", swUrl);
      // Check for updates every 60 seconds
      if (r) {
        setInterval(() => {
          console.log("[PWA] Checking for updates...");
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("[PWA] Service worker registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[200] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-gold/30 rounded-lg shadow-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Update Available</p>
          <p className="text-xs text-muted-foreground">
            A new version is ready. Refresh to get the latest features.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="bg-gold hover:bg-gold/90 text-black"
            onClick={handleUpdate}
          >
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}
