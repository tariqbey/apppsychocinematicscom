import { useState, useEffect, useMemo } from "react";
import { Download, X, Share, Plus, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa-mobile-install-shown";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Detect mobile/tablet (not desktop)
  const isMobileOrTablet = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  useEffect(() => {
    // Don't show on desktop
    if (!isMobileOrTablet) return;

    // Don't show if already installed as PWA
    if (isStandalone) return;

    // Check if already shown before (ONE TIME ONLY)
    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    if (alreadyShown === "true") return;

    // Listen for the beforeinstallprompt event (Chrome/Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay so user sees the app first
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS, show after a short delay
    if (isIOS) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    // For Android without beforeinstallprompt (rare), show generic instructions
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt) {
        setShowPrompt(true);
      }
    }, 4000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [isMobileOrTablet, isStandalone, isIOS, deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        handleDismiss();
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    // Mark as shown FOREVER (one-time only)
    localStorage.setItem(STORAGE_KEY, "true");
    setShowPrompt(false);
  };

  // Don't render if conditions not met
  if (!isMobileOrTablet || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-card border-gold/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold/20 via-amber-500/10 to-gold/20 p-4 flex items-center gap-4">
          <div className="relative">
            <img
              src={psychoCinematicsLogo}
              alt="Psycho-Cinematics"
              className="h-14 w-14 rounded-xl"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <Smartphone className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Install the App</h3>
            <p className="text-sm text-muted-foreground">Save to your home screen</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-5">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Full Screen</p>
            </div>
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-1">
                <Download className="h-5 w-5 text-gold" />
              </div>
              <p className="text-xs text-muted-foreground">Quick Access</p>
            </div>
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-1">
                <span className="text-lg">🔔</span>
              </div>
              <p className="text-xs text-muted-foreground">Notifications</p>
            </div>
          </div>

          {isIOS ? (
            /* iOS Instructions */
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground font-medium">
                Add to your Home Screen in 2 steps:
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tap the Share button</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Share className="h-3 w-3" /> at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tap "Add to Home Screen"</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Then tap "Add"
                  </p>
                </div>
              </div>
              <Button variant="gold" className="w-full mt-3" onClick={handleDismiss}>
                Got it!
              </Button>
            </div>
          ) : deferredPrompt ? (
            /* Android Install Button (native prompt available) */
            <div className="space-y-3">
              <Button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-semibold h-12"
              >
                <Download className="h-5 w-5 mr-2" />
                Install App
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Free • No app store • Instant access
              </p>
            </div>
          ) : (
            /* Android fallback instructions (no native prompt) */
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground font-medium">
                Add to your Home Screen:
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tap the menu (⋮)</p>
                  <p className="text-xs text-muted-foreground">Top-right of Chrome</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tap "Add to Home screen"</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Then tap "Add"
                  </p>
                </div>
              </div>
              <Button variant="gold" className="w-full mt-3" onClick={handleDismiss}>
                Got it!
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
