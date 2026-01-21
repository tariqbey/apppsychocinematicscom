import { useState, useEffect } from "react";
import { AppLoader } from "@/components/ui/AppLoader";

interface SplashScreenWrapperProps {
  children: React.ReactNode;
}

export function SplashScreenWrapper({ children }: SplashScreenWrapperProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Only show splash screen when launched from home screen (standalone PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    // Check if we've shown the splash recently (within this session)
    const hasShownSplash = sessionStorage.getItem('splash-shown');
    
    if (isStandalone && !hasShownSplash) {
      setShowSplash(true);
      sessionStorage.setItem('splash-shown', 'true');
    } else {
      setIsComplete(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setIsComplete(true);
    // Small delay before hiding to allow fade animation
    setTimeout(() => setShowSplash(false), 100);
  };

  return (
    <>
      {showSplash && (
        <AppLoader isSplashScreen onComplete={handleSplashComplete} />
      )}
      <div className={isComplete ? 'opacity-100' : 'opacity-0'}>
        {children}
      </div>
    </>
  );
}
