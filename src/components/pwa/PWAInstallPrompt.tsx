import { useState, useEffect } from "react";
import { Download, X, Share, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user previously dismissed
    const previouslyDismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = previouslyDismissed ? parseInt(previouslyDismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show again after 7 days
    if (daysSinceDismissed < 7) {
      setDismissed(true);
    }

    // Listen for the beforeinstallprompt event (Chrome/Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show after a short delay if not installed
    if (iOS && !standalone && daysSinceDismissed >= 7) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
    setDismissed(true);
  };

  // Don't show if already installed, dismissed, or shouldn't show
  if (isStandalone || dismissed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up safe-area-bottom">
      <Card className="max-w-md mx-auto bg-card/95 backdrop-blur-lg border-gold/20 shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-gold/20 via-amber-500/10 to-gold/20 p-4 flex items-center gap-4">
          <div className="relative">
            <img 
              src={psychoCinematicsLogo} 
              alt="Psycho-Cinematics" 
              className="h-14 w-14 rounded-xl"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <Download className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Install Psycho-Cinematics</h3>
            <p className="text-sm text-muted-foreground">Get the full app experience</p>
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

        <div className="p-4">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Works Offline</p>
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
              <p className="text-sm text-center text-muted-foreground">
                Add to your home screen in 2 easy steps:
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tap the Share button</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Look for <Share className="h-3 w-3" /> in Safari's toolbar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tap "Add to Home Screen"</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Look for <Plus className="h-3 w-3" /> Add to Home Screen
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={handleDismiss}
              >
                Got it!
              </Button>
            </div>
          ) : (
            /* Android/Desktop Install Button */
            <div className="space-y-3">
              <Button 
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-semibold h-12"
              >
                <Download className="h-5 w-5 mr-2" />
                Install App
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Free • No app store needed • Instant access
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
