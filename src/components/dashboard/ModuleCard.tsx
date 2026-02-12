import { ReactNode, useEffect, useState } from "react";
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
  animationIndex?: number;
}

const colorConfig = {
  gold: {
    accent: "hsl(37 87% 57%)",
    border: "hover:border-gold/40",
    iconBg: "from-gold/20 to-gold/5",
    titleHover: "group-hover:text-gold",
    glowColor: "hsl(37 87% 57% / 0.3)",
  },
  cyan: {
    accent: "hsl(187 92% 53%)",
    border: "hover:border-cyan-400/40",
    iconBg: "from-cyan-500/20 to-cyan-500/5",
    titleHover: "group-hover:text-cyan-400",
    glowColor: "hsl(187 92% 53% / 0.3)",
  },
  amber: {
    accent: "hsl(37 87% 57%)",
    border: "hover:border-amber-500/40",
    iconBg: "from-amber-500/20 to-amber-500/5",
    titleHover: "group-hover:text-amber-500",
    glowColor: "hsl(37 87% 57% / 0.3)",
  },
  purple: {
    accent: "hsl(271 81% 56%)",
    border: "hover:border-purple-400/40",
    iconBg: "from-purple-500/20 to-purple-500/5",
    titleHover: "group-hover:text-purple-400",
    glowColor: "hsl(271 81% 56% / 0.3)",
  },
  pink: {
    accent: "hsl(330 81% 60%)",
    border: "hover:border-pink-400/40",
    iconBg: "from-pink-500/20 to-pink-500/5",
    titleHover: "group-hover:text-pink-400",
    glowColor: "hsl(330 81% 60% / 0.3)",
  },
  red: {
    accent: "hsl(0 84% 60%)",
    border: "hover:border-red-400/40",
    iconBg: "from-red-500/20 to-red-500/5",
    titleHover: "group-hover:text-red-400",
    glowColor: "hsl(0 84% 60% / 0.3)",
  },
  green: {
    accent: "hsl(142 71% 45%)",
    border: "hover:border-green-400/40",
    iconBg: "from-green-500/20 to-green-500/5",
    titleHover: "group-hover:text-green-500",
    glowColor: "hsl(142 71% 45% / 0.3)",
  },
  emerald: {
    accent: "hsl(160 84% 39%)",
    border: "hover:border-emerald-400/40",
    iconBg: "from-emerald-500/20 to-emerald-500/5",
    titleHover: "group-hover:text-emerald-400",
    glowColor: "hsl(160 84% 39% / 0.3)",
  },
  primary: {
    accent: "hsl(37 87% 57%)",
    border: "hover:border-primary/40",
    iconBg: "from-primary/20 to-primary/5",
    titleHover: "group-hover:text-primary",
    glowColor: "hsl(37 87% 57% / 0.3)",
  },
};

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
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimatedIn(true);
    }, isMobile ? 100 + animationIndex * 80 : 50);
    return () => clearTimeout(timer);
  }, [isMobile, animationIndex]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "w-full relative group text-left overflow-hidden",
        "rounded-xl border border-border/30 bg-card",
        "transition-all duration-400 ease-out",
        colors.border,
        "active:scale-[0.98] hover:translate-y-[-2px]",
        featured && "ring-1 ring-gold/20",
        !hasAnimatedIn && "opacity-0 translate-y-4",
        hasAnimatedIn && "opacity-100 translate-y-0",
        className
      )}
      style={{
        boxShadow: isHovered ? `0 8px 30px ${colors.glowColor}` : `0 0 0 0 transparent`,
        transitionDelay: !hasAnimatedIn ? `${animationIndex * 60}ms` : '0ms',
        animation: hasAnimatedIn ? `module-glow-pulse 4s ease-in-out ${animationIndex * 0.5}s infinite` : 'none',
      }}
    >
      {/* Card content */}
      <div className="relative z-10 p-5 sm:p-6 flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br transition-all duration-300",
            colors.iconBg,
            isHovered && "scale-105"
          )}
          style={{
            boxShadow: isHovered ? `0 0 20px ${colors.glowColor}` : 'none',
          }}
        >
          {iconImage ? (
            <img src={iconImage} alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          ) : (
            <div>{icon}</div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={cn(
              "font-display text-lg sm:text-xl tracking-wide transition-colors duration-300",
              colors.titleHover
            )}>
              {title}
            </h3>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          {/* Description: hidden by default, slides up on hover */}
          <p className={cn(
            "font-ui text-xs text-muted-foreground line-clamp-1 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-60 translate-y-0"
          )}>
            {description}
          </p>
        </div>

        {/* Arrow */}
        <div className={cn(
          "hidden sm:block font-ui text-xs uppercase tracking-wider text-muted-foreground transition-all duration-300",
          isHovered && "text-foreground translate-x-1"
        )}>
          →
        </div>
      </div>

      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
        <div
          className="h-full w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
            animation: 'calendar-shimmer 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Bottom amber progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div 
          className="h-full w-0 group-hover:w-full transition-all duration-700 ease-out"
          style={{
            background: colors.accent,
            boxShadow: `0 0 8px ${colors.glowColor}`,
          }}
        />
      </div>
    </button>
  );
}
