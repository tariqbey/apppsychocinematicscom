import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PWAUpdatePrompt() {
  const {
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

  // Auto-update applies automatically, no UI needed
  return null;
}
