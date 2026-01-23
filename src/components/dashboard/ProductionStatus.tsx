import { Clapperboard, Star, Sparkles, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductionStatusProps {
  currentAct: string;
  dayNumber: number;
}

// Floating particle component
const FloatingParticle = ({ delay, size = 2, color = "#D4AF37" }: { delay: number; size?: number; color?: string }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      left: `${Math.random() * 100}%`,
      bottom: '0%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      animation: `float-particle 3s ease-in-out infinite ${delay}s`,
    }}
  />
);

export const ProductionStatus = ({ currentAct, dayNumber }: ProductionStatusProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isActive = isHovered || isTouched;

  return (
    <div 
      className={cn(
        "glass-card p-4 sm:p-6 cinematic-border relative overflow-hidden group transition-all duration-500",
        "hover:border-gold/50 active:scale-[0.99]",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ 
        boxShadow: isActive 
          ? '0 0 50px rgba(212, 175, 55, 0.25), inset 0 0 60px rgba(212, 175, 55, 0.05)'
          : '0 0 30px rgba(212, 175, 55, 0.1), inset 0 0 50px rgba(212, 175, 55, 0.03)',
        transition: 'all 0.5s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setTimeout(() => setIsTouched(false), 200)}
    >
      {/* Holographic scan lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.03)_50%)] bg-[length:100%_4px]"
          style={{
            animation: 'scan-line 8s linear infinite',
          }}
        />
      </div>

      {/* Animated corner accents - show on mobile when visible */}
      <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-gold/0 via-gold/50 to-gold/0 transition-opacity duration-500",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} />
      </div>

      {/* Scanning line animation */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-300 pointer-events-none overflow-hidden",
          isActive ? "opacity-100" : "opacity-0"
        )}
      >
        <div 
          className="absolute h-[1px] w-full bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0"
          style={{
            animation: isActive ? 'scan-line 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Holographic shimmer overlay */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-700 pointer-events-none rounded-lg",
          isActive ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.03) 45%,
            rgba(255,255,255,0.05) 50%,
            rgba(255,255,255,0.03) 55%,
            transparent 60%
          )`,
          backgroundSize: '200% 100%',
          animation: isActive ? 'holographic-shimmer 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Floating particles - always show on mobile after entrance */}
      <div className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500",
        (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
      )}>
        <FloatingParticle delay={0} size={3} />
        <FloatingParticle delay={0.5} size={2} />
        <FloatingParticle delay={1} size={4} />
        <FloatingParticle delay={1.5} size={2} />
        <FloatingParticle delay={2} size={3} />
      </div>
      
      {/* Sparkle particles */}
      <Sparkles className={cn(
        "absolute top-3 right-12 w-4 h-4 text-gold/40 animate-pulse pointer-events-none transition-all duration-500",
        (isActive || (isMobile && isVisible)) && "scale-125 text-gold/60"
      )} />
      <Sparkles 
        className={cn(
          "absolute bottom-3 right-28 w-3 h-3 text-amber-soft/30 animate-pulse pointer-events-none transition-all duration-500",
          (isActive || (isMobile && isVisible)) && "scale-125 text-amber-soft/50"
        )} 
        style={{ animationDelay: '0.5s' }} 
      />
      <Zap 
        className={cn(
          "absolute top-4 right-6 w-3 h-3 text-gold/30 animate-pulse pointer-events-none transition-all duration-300",
          (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
        )} 
        style={{ animationDelay: '1s' }} 
      />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div 
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center transition-all duration-300 relative overflow-hidden",
              (isActive || (isMobile && isVisible)) && "scale-110"
            )}
            style={{
              boxShadow: (isActive || (isMobile && isVisible)) 
                ? '0 0 30px rgba(212, 175, 55, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.3)' 
                : '0 0 15px rgba(212, 175, 55, 0.3)',
            }}
          >
            {/* Pulsing ring */}
            <div 
              className={cn(
                "absolute inset-0 rounded-lg transition-opacity",
                (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
              )}
              style={{
                border: '1px solid #D4AF37',
                animation: (isActive || (isMobile && isVisible)) ? 'pulse-ring 1.5s ease-out infinite' : 'none',
              }}
            />
            
            {/* Inner glow */}
            <div 
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.4) 0%, transparent 70%)',
                opacity: (isActive || (isMobile && isVisible)) ? 0.8 : 0.5,
                transition: 'opacity 0.5s',
              }}
            />
            
            {/* Rotating border */}
            <div 
              className={cn(
                "absolute inset-[-2px] rounded-lg transition-opacity pointer-events-none",
                (isActive || (isMobile && isVisible)) ? "opacity-100" : "opacity-0"
              )}
              style={{
                background: 'conic-gradient(from 0deg, transparent, #D4AF37, transparent)',
                animation: (isActive || (isMobile && isVisible)) ? 'rotate-border 3s linear infinite' : 'none',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'xor',
                WebkitMaskComposite: 'xor',
                padding: '2px',
              }}
            />
            
            <Clapperboard className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground relative z-10" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wider">Current Production</p>
            <h2 className={cn(
              "text-lg sm:text-2xl font-display text-gold-gradient transition-all duration-300",
              isActive && "scale-[1.02]"
            )}>{currentAct}</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Star 
              className={cn(
                "w-4 h-4 text-gold fill-gold animate-pulse transition-all duration-300",
                (isActive || (isMobile && isVisible)) && "scale-125"
              )}
              style={{
                filter: (isActive || (isMobile && isVisible)) ? 'drop-shadow(0 0 6px #D4AF37)' : 'none',
              }}
            />
            <span className="text-muted-foreground text-xs sm:text-sm">Day</span>
          </div>
          <p className={cn(
            "text-2xl sm:text-3xl font-display text-foreground transition-all duration-300",
            (isActive || (isMobile && isVisible)) && "text-gold scale-105"
          )}>{dayNumber}</p>
        </div>
      </div>

      {/* Bottom energy bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div 
          className="h-full w-0 group-hover:w-full transition-all duration-700 ease-out bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0"
          style={{
            boxShadow: '0 0 10px #D4AF37',
          }}
        />
      </div>
    </div>
  );
};