import { useState, useEffect } from "react";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";

interface AppLoaderProps {
  onComplete?: () => void;
  isSplashScreen?: boolean;
}

export const AppLoader = ({ onComplete, isSplashScreen = false }: AppLoaderProps) => {
  const [phase, setPhase] = useState<'initial' | 'reveal' | 'glow' | 'fade'>('initial');

  useEffect(() => {
    if (!isSplashScreen) return;
    
    // Cinematic reveal sequence
    const timeline = [
      { phase: 'reveal' as const, delay: 100 },
      { phase: 'glow' as const, delay: 1200 },
      { phase: 'fade' as const, delay: 2400 },
    ];
    
    const timeouts = timeline.map(({ phase, delay }) => 
      setTimeout(() => setPhase(phase), delay)
    );
    
    const completeTimeout = setTimeout(() => {
      onComplete?.();
    }, 3200);
    
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [isSplashScreen, onComplete]);

  // Simple loader for non-splash contexts
  if (!isSplashScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <img 
            src={psychoCinematicsLogo} 
            alt="Psycho-Cinematics" 
            className="h-24 w-auto animate-pulse"
          />
          <div className="absolute inset-0 -m-4">
            <div className="w-full h-full rounded-full border-2 border-transparent border-t-gold border-r-gold/50 animate-spin" 
                 style={{ animationDuration: '1.5s' }} 
            />
          </div>
        </div>
        <p className="mt-8 text-sm text-muted-foreground animate-pulse">
          Preparing your studio...
        </p>
        <div className="flex gap-1.5 mt-4">
          <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // Cinematic splash screen
  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${
        phase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Film grain overlay */}
      <div className="absolute inset-0 film-grain opacity-30 pointer-events-none" />
      
      {/* Spotlight effect */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          phase === 'initial' ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 50%)',
        }}
      />
      
      {/* Logo container */}
      <div className="relative">
        {/* Glow ring */}
        <div 
          className={`absolute inset-0 -m-8 rounded-full transition-all duration-1000 ${
            phase === 'glow' ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        
        {/* Main logo */}
        <img 
          src={psychoCinematicsLogo} 
          alt="Psycho-Cinematics" 
          className={`h-32 w-auto relative z-10 transition-all duration-1000 ${
            phase === 'initial' 
              ? 'opacity-0 scale-75 blur-sm' 
              : phase === 'reveal'
              ? 'opacity-100 scale-100 blur-0'
              : 'opacity-100 scale-105 blur-0'
          }`}
          style={{
            filter: phase === 'glow' ? 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.8))' : undefined,
          }}
        />
      </div>
      
      {/* Tagline */}
      <p 
        className={`mt-8 text-gold/80 text-sm tracking-[0.3em] uppercase font-light transition-all duration-700 delay-300 ${
          phase === 'initial' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        The Director's OS
      </p>
      
      {/* Cinematic bars */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
};