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
    borderDefault: "border-gold/15",
    iconBg: "from-gold/25 to-gold/8",
    titleColor: "text-gold",
    titleHover: "group-hover:text-gold",
    glowColor: "hsl(37 87% 57% / 0.3)",
    bgTint: "hsl(37 87% 57% / 0.04)",
    radialGlow: "hsl(37 87% 57% / 0.06)",
  },
  cyan: {
    accent: "hsl(187 92% 53%)",
    border: "hover:border-cyan-400/40",
    borderDefault: "border-cyan-400/15",
    iconBg: "from-cyan-500/25 to-cyan-500/8",
    titleColor: "text-cyan-400",
    titleHover: "group-hover:text-cyan-400",
    glowColor: "hsl(187 92% 53% / 0.3)",
    bgTint: "hsl(187 92% 53% / 0.04)",
    radialGlow: "hsl(187 92% 53% / 0.06)",
  },
  amber: {
    accent: "hsl(37 87% 57%)",
    border: "hover:border-amber-500/40",
    borderDefault: "border-amber-500/15",
    iconBg: "from-amber-500/25 to-amber-500/8",
    titleColor: "text-amber-500",
    titleHover: "group-hover:text-amber-500",
    glowColor: "hsl(37 87% 57% / 0.3)",
    bgTint: "hsl(37 87% 57% / 0.04)",
    radialGlow: "hsl(37 87% 57% / 0.06)",
  },
  purple: {
    accent: "hsl(271 81% 56%)",
    border: "hover:border-purple-400/40",
    borderDefault: "border-purple-400/15",
    iconBg: "from-purple-500/25 to-purple-500/8",
    titleColor: "text-purple-400",
    titleHover: "group-hover:text-purple-400",
    glowColor: "hsl(271 81% 56% / 0.3)",
    bgTint: "hsl(271 81% 56% / 0.04)",
    radialGlow: "hsl(271 81% 56% / 0.06)",
  },
  pink: {
    accent: "hsl(330 81% 60%)",
    border: "hover:border-pink-400/40",
    borderDefault: "border-pink-400/15",
    iconBg: "from-pink-500/25 to-pink-500/8",
    titleColor: "text-pink-400",
    titleHover: "group-hover:text-pink-400",
    glowColor: "hsl(330 81% 60% / 0.3)",
    bgTint: "hsl(330 81% 60% / 0.04)",
    radialGlow: "hsl(330 81% 60% / 0.06)",
  },
  red: {
    accent: "hsl(0 84% 60%)",
    border: "hover:border-red-400/40",
    borderDefault: "border-red-400/15",
    iconBg: "from-red-500/25 to-red-500/8",
    titleColor: "text-red-400",
    titleHover: "group-hover:text-red-400",
    glowColor: "hsl(0 84% 60% / 0.3)",
    bgTint: "hsl(0 84% 60% / 0.04)",
    radialGlow: "hsl(0 84% 60% / 0.06)",
  },
  green: {
    accent: "hsl(142 71% 45%)",
    border: "hover:border-green-400/40",
    borderDefault: "border-green-400/15",
    iconBg: "from-green-500/25 to-green-500/8",
    titleColor: "text-green-500",
    titleHover: "group-hover:text-green-500",
    glowColor: "hsl(142 71% 45% / 0.3)",
    bgTint: "hsl(142 71% 45% / 0.04)",
    radialGlow: "hsl(142 71% 45% / 0.06)",
  },
  emerald: {
    accent: "hsl(160 84% 39%)",
    border: "hover:border-emerald-400/40",
    borderDefault: "border-emerald-400/15",
    iconBg: "from-emerald-500/25 to-emerald-500/8",
    titleColor: "text-emerald-400",
    titleHover: "group-hover:text-emerald-400",
    glowColor: "hsl(160 84% 39% / 0.3)",
    bgTint: "hsl(160 84% 39% / 0.04)",
    radialGlow: "hsl(160 84% 39% / 0.06)",
  },
  primary: {
    accent: "hsl(37 87% 57%)",
    border: "hover:border-primary/40",
    borderDefault: "border-primary/15",
    iconBg: "from-primary/25 to-primary/8",
    titleColor: "text-primary",
    titleHover: "group-hover:text-primary",
    glowColor: "hsl(37 87% 57% / 0.3)",
    bgTint: "hsl(37 87% 57% / 0.04)",
    radialGlow: "hsl(37 87% 57% / 0.06)",
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
        "rounded-xl border",
        "transition-all duration-400 ease-out",
        colors.border,
        colors.borderDefault,
        "active:scale-[0.98] hover:translate-y-[-2px]",
        featured && "ring-1 ring-gold/20",
        !hasAnimatedIn && "opacity-0 translate-y-4",
        hasAnimatedIn && "opacity-100 translate-y-0",
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(240 5% 8%) 0%, ${colors.bgTint} 50%, hsl(240 5% 8%) 100%)`,
        boxShadow: isHovered ? `0 8px 30px ${colors.glowColor}` : `0 0 0 0 transparent`,
        transitionDelay: !hasAnimatedIn ? `${animationIndex * 60}ms` : '0ms',
      }}
    >
      {/* Persistent radial glow — always visible, stronger on hover */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 10% 50%, ${isHovered ? colors.glowColor : colors.radialGlow} 0%, transparent 60%)`,
          opacity: 1,
        }}
      />

      {/* Breathing shimmer — always animating */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${colors.accent}06 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: `calendar-shimmer ${5 + animationIndex * 0.5}s ease-in-out infinite`,
        }}
      />

      {/* Top accent line — always visible */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.accent}40, transparent)`,
        }}
      />

      {/* Left color bar — persistent color indicator */}
      <div className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full"
        style={{
          background: `linear-gradient(to bottom, transparent, ${colors.accent}50, transparent)`,
        }}
      />

      {/* Card content */}
      <div className="relative z-10 p-5 sm:p-6 flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br transition-all duration-300",
            colors.iconBg,
            isHovered && "scale-110"
          )}
          style={{
            boxShadow: `0 0 ${isHovered ? '25px' : '12px'} ${isHovered ? colors.glowColor : colors.radialGlow}`,
            transition: 'box-shadow 0.3s, transform 0.3s',
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
              colors.titleColor,
              colors.titleHover
            )}>
              {title}
            </h3>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <p className="font-ui text-xs text-muted-foreground line-clamp-1 opacity-70">
            {description}
          </p>
        </div>

        {/* Arrow */}
        <div className={cn(
          "hidden sm:block font-ui text-xs uppercase tracking-wider transition-all duration-300",
          isHovered ? "text-foreground translate-x-1" : "text-muted-foreground"
        )}>
          →
        </div>
      </div>

      {/* Bottom progress line */}
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
