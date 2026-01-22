import { ReactNode, useEffect, useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModuleCardProps {
  onClick: () => void;
  icon: ReactNode;
  iconImage?: string;
  title: string;
  description: string;
  actionText: string;
  colorScheme: 
    | "gold" 
    | "cyan" 
    | "amber" 
    | "purple" 
    | "pink" 
    | "red" 
    | "green" 
    | "emerald"
    | "primary";
  tooltip?: string;
  className?: string;
  featured?: boolean;
  /** Stagger index for entrance animation (0, 1, 2...) */
  animationIndex?: number;
}

const colorConfig = {
  gold: {
    border: "hover:border-gold/60",
    iconBg: "from-gold/30 to-amber-600/30",
    iconGlow: "shadow-gold/40",
    titleColor: "group-hover:text-gold",
    sparkle: "text-gold",
    action: "group-hover:text-gold",
    glowColor: "rgba(212, 175, 55, 0.4)",
    particleColor: "#D4AF37",
    scanlineColor: "from-gold/0 via-gold/50 to-gold/0",
  },
  cyan: {
    border: "hover:border-cyan-400/60",
    iconBg: "from-cyan-500/30 to-teal-500/30",
    iconGlow: "shadow-cyan-500/40",
    titleColor: "group-hover:text-cyan-400",
    sparkle: "text-cyan-400",
    action: "group-hover:text-cyan-400",
    glowColor: "rgba(34, 211, 238, 0.4)",
    particleColor: "#22D3EE",
    scanlineColor: "from-cyan-400/0 via-cyan-400/50 to-cyan-400/0",
  },
  amber: {
    border: "hover:border-amber-500/60",
    iconBg: "from-amber-500/30 to-orange-600/30",
    iconGlow: "shadow-amber-500/40",
    titleColor: "group-hover:text-amber-500",
    sparkle: "text-amber-500",
    action: "group-hover:text-amber-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    particleColor: "#F59E0B",
    scanlineColor: "from-amber-500/0 via-amber-500/50 to-amber-500/0",
  },
  purple: {
    border: "hover:border-purple-400/60",
    iconBg: "from-purple-500/30 to-pink-500/30",
    iconGlow: "shadow-purple-500/40",
    titleColor: "group-hover:text-purple-400",
    sparkle: "text-purple-400",
    action: "group-hover:text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.4)",
    particleColor: "#A855F7",
    scanlineColor: "from-purple-400/0 via-purple-400/50 to-purple-400/0",
  },
  pink: {
    border: "hover:border-pink-400/60",
    iconBg: "from-pink-500/30 to-rose-500/30",
    iconGlow: "shadow-pink-500/40",
    titleColor: "group-hover:text-pink-400",
    sparkle: "text-pink-400",
    action: "group-hover:text-pink-400",
    glowColor: "rgba(236, 72, 153, 0.4)",
    particleColor: "#EC4899",
    scanlineColor: "from-pink-400/0 via-pink-400/50 to-pink-400/0",
  },
  red: {
    border: "hover:border-red-400/60",
    iconBg: "from-red-500/30 to-orange-500/30",
    iconGlow: "shadow-red-500/40",
    titleColor: "group-hover:text-red-400",
    sparkle: "text-red-400",
    action: "group-hover:text-red-400",
    glowColor: "rgba(239, 68, 68, 0.4)",
    particleColor: "#EF4444",
    scanlineColor: "from-red-400/0 via-red-400/50 to-red-400/0",
  },
  green: {
    border: "hover:border-green-400/60",
    iconBg: "from-green-500/30 to-emerald-600/30",
    iconGlow: "shadow-green-500/40",
    titleColor: "group-hover:text-green-500",
    sparkle: "text-green-500",
    action: "group-hover:text-green-500",
    glowColor: "rgba(34, 197, 94, 0.4)",
    particleColor: "#22C55E",
    scanlineColor: "from-green-400/0 via-green-400/50 to-green-400/0",
  },
  emerald: {
    border: "hover:border-emerald-400/60",
    iconBg: "from-emerald-500/30 to-green-500/30",
    iconGlow: "shadow-emerald-500/40",
    titleColor: "group-hover:text-emerald-400",
    sparkle: "text-emerald-400",
    action: "group-hover:text-emerald-400",
    glowColor: "rgba(52, 211, 153, 0.4)",
    particleColor: "#34D399",
    scanlineColor: "from-emerald-400/0 via-emerald-400/50 to-emerald-400/0",
  },
  primary: {
    border: "hover:border-primary/60",
    iconBg: "from-primary/30 to-primary/50",
    iconGlow: "shadow-primary/40",
    titleColor: "group-hover:text-primary",
    sparkle: "text-primary",
    action: "group-hover:text-primary",
    glowColor: "rgba(212, 175, 55, 0.4)",
    particleColor: "#D4AF37",
    scanlineColor: "from-primary/0 via-primary/50 to-primary/0",
  },
};

// Floating particle component
function FloatingParticle({ color, delay }: { color: string; delay: number }) {
  return (
    <div
      className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none"
      style={{
        background: color,
        boxShadow: `0 0 6px ${color}`,
        animation: `float-particle 3s ease-in-out ${delay}s infinite`,
        left: `${Math.random() * 100}%`,
        bottom: '0%',
      }}
    />
  );
}

export function ModuleCard({
  onClick,
  icon,
  iconImage,
  title,
  description,
  actionText,
  colorScheme,
  tooltip,
  className,
  featured = false,
  animationIndex = 0,
}: ModuleCardProps) {
  const colors = colorConfig[colorScheme];
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  // On mobile, trigger entrance animation with stagger
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        setHasAnimatedIn(true);
      }, 100 + animationIndex * 80);
      return () => clearTimeout(timer);
    } else {
      setHasAnimatedIn(true);
    }
  }, [isMobile, animationIndex]);

  // On mobile, the "active" state replaces hover
  const isActive = isHovered || isTouched;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setTimeout(() => setIsTouched(false), 200)}
      className={cn(
        // Base styles
        "w-full relative p-5 sm:p-6 group text-left overflow-hidden",
        "transition-all duration-500 ease-out",
        // Glass morphism background
        "bg-gradient-to-br from-card/80 via-card/60 to-card/40",
        "backdrop-blur-xl",
        // Border effects
        "border border-border/40 rounded-xl",
        colors.border,
        // Shadow and glow
        "hover:shadow-2xl",
        // Transform
        "active:scale-[0.98] hover:scale-[1.02]",
        // Featured ring effect
        featured && "ring-2 ring-gold/30 hover:ring-gold/60",
        // Entrance animation
        !hasAnimatedIn && "opacity-0 translate-y-4",
        hasAnimatedIn && "opacity-100 translate-y-0",
        className
      )}
      style={{
        boxShadow: isActive ? `0 0 40px ${colors.glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
        transitionDelay: !hasAnimatedIn ? `${animationIndex * 80}ms` : '0ms',
      }}
    >
      {/* Animated corner accents - show on mobile when hasAnimatedIn */}
      <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
        )} />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
        <div className={cn(
          "absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t transition-opacity duration-500",
          colors.scanlineColor,
          (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
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
          className={cn("absolute h-[1px] w-full bg-gradient-to-r", colors.scanlineColor)}
          style={{
            animation: isActive ? 'scan-line 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* Floating particles - always show on mobile after entrance */}
      <div className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500",
        (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
      )}>
        {[0, 0.5, 1, 1.5, 2].map((delay, i) => (
          <FloatingParticle key={i} color={colors.particleColor} delay={delay} />
        ))}
      </div>

      {/* Holographic shimmer overlay */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-700 pointer-events-none",
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

      {/* Content */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Icon container with enhanced glow effect */}
        <div
          className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br transition-all duration-500",
            colors.iconBg,
            "relative overflow-hidden",
            isActive && "scale-110"
          )}
          style={{
            boxShadow: (isActive || (isMobile && hasAnimatedIn)) 
              ? `0 0 30px ${colors.glowColor}, inset 0 0 20px ${colors.glowColor}` 
              : `0 0 15px ${colors.glowColor}`,
          }}
        >
          {/* Pulsing ring - show on mobile after animation */}
          <div 
            className={cn(
              "absolute inset-0 rounded-xl transition-opacity",
              (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
            )}
            style={{
              border: `1px solid ${colors.particleColor}`,
              animation: (isActive || (isMobile && hasAnimatedIn)) ? 'pulse-ring 1.5s ease-out infinite' : 'none',
            }}
          />
          
          {/* Inner glow */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `radial-gradient(circle at center, ${colors.glowColor} 0%, transparent 70%)`,
              opacity: (isActive || (isMobile && hasAnimatedIn)) ? 0.6 : 0.3,
              transition: 'opacity 0.5s',
            }}
          />
          
          {/* Rotating border */}
          <div 
            className={cn(
              "absolute inset-[-2px] rounded-xl transition-opacity pointer-events-none",
              (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
            )}
            style={{
              background: `conic-gradient(from 0deg, transparent, ${colors.particleColor}, transparent)`,
              animation: (isActive || (isMobile && hasAnimatedIn)) ? 'rotate-border 3s linear infinite' : 'none',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
              padding: '2px',
            }}
          />

          {iconImage ? (
            <img 
              src={iconImage} 
              alt="" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain relative z-10 drop-shadow-lg" 
            />
          ) : (
            <div className="relative z-10 drop-shadow-lg">{icon}</div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3
              className={cn(
                "text-lg sm:text-xl font-display tracking-wide transition-all duration-300",
                "drop-shadow-sm",
                colors.titleColor
              )}
            >
              {title}
            </h3>
            <div className="flex items-center gap-1">
              <Sparkles 
                className={cn(
                  "w-4 h-4 transition-all duration-500",
                  (isActive || (isMobile && hasAnimatedIn)) && "rotate-12 scale-125",
                  "drop-shadow-lg",
                  colors.sparkle
                )} 
                style={{
                  filter: (isActive || (isMobile && hasAnimatedIn)) ? `drop-shadow(0 0 4px ${colors.particleColor})` : 'none',
                }}
              />
              <Zap 
                className={cn(
                  "w-3 h-3 transition-all duration-300",
                  "animate-pulse",
                  colors.sparkle,
                  (isActive || (isMobile && hasAnimatedIn)) ? "opacity-100" : "opacity-0"
                )} 
              />
            </div>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <p className={cn(
            "text-xs sm:text-sm text-muted-foreground line-clamp-2 transition-colors duration-300",
            (isActive || (isMobile && hasAnimatedIn)) && "text-foreground/80"
          )}>
            {description}
          </p>
        </div>

        {/* Action indicator */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-2 text-sm transition-all duration-500",
            "text-muted-foreground",
            colors.action
          )}
        >
          <span className={cn(
            "transition-transform duration-300 whitespace-nowrap",
            isActive && "translate-x-1"
          )}>
            {actionText}
          </span>
          <span 
            className={cn(
              "text-lg transition-all duration-300",
              isActive && "translate-x-2 scale-125"
            )}
            style={{
              filter: isActive ? `drop-shadow(0 0 6px ${colors.particleColor})` : 'none',
            }}
          >
            →
          </span>
        </div>
      </div>

      {/* Bottom energy bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div 
          className={cn(
            "h-full w-0 group-hover:w-full transition-all duration-700 ease-out",
            "bg-gradient-to-r",
            colors.scanlineColor
          )}
          style={{
            boxShadow: `0 0 10px ${colors.particleColor}`,
          }}
        />
      </div>
    </button>
  );
}

// Inject keyframes for animations
const moduleCardAnimations = `
@keyframes float-particle {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) translateX(20px);
    opacity: 0;
  }
}

@keyframes scan-line {
  0% {
    top: 0%;
  }
  100% {
    top: 100%;
  }
}

@keyframes holographic-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes rotate-border {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`;

// Inject keyframes if not already present
if (typeof document !== 'undefined') {
  const styleId = 'module-card-futuristic';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = moduleCardAnimations;
    document.head.appendChild(style);
  }
}
