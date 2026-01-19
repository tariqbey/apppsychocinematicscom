import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

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
}

const colorConfig = {
  gold: {
    border: "hover:border-gold/50 hover:shadow-gold/20",
    iconBg: "from-gold/20 to-amber-soft/20 group-hover:from-gold/40 group-hover:to-amber-soft/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-gold/30",
    titleColor: "group-hover:text-gold",
    sparkle: "text-gold/60",
    action: "group-hover:text-gold",
  },
  cyan: {
    border: "hover:border-cyan-500/50 hover:shadow-cyan-500/20",
    iconBg: "from-cyan-500/20 to-teal-500/20 group-hover:from-cyan-500/40 group-hover:to-teal-500/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-cyan-500/30",
    titleColor: "group-hover:text-cyan-400",
    sparkle: "text-cyan-400/60",
    action: "group-hover:text-cyan-400",
  },
  amber: {
    border: "hover:border-amber-500/50 hover:shadow-amber-500/20",
    iconBg: "from-amber-500/20 to-orange-600/20 group-hover:from-amber-500/40 group-hover:to-orange-600/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-amber-500/30",
    titleColor: "group-hover:text-amber-500",
    sparkle: "text-amber-500/60",
    action: "group-hover:text-amber-500",
  },
  purple: {
    border: "hover:border-purple-500/50 hover:shadow-purple-500/20",
    iconBg: "from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/40 group-hover:to-pink-500/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-purple-500/30",
    titleColor: "group-hover:text-purple-400",
    sparkle: "text-purple-400/60",
    action: "group-hover:text-purple-400",
  },
  pink: {
    border: "hover:border-pink-500/50 hover:shadow-pink-500/20",
    iconBg: "from-pink-500/20 to-rose-500/20 group-hover:from-pink-500/40 group-hover:to-rose-500/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-pink-500/30",
    titleColor: "group-hover:text-pink-400",
    sparkle: "text-pink-400/60",
    action: "group-hover:text-pink-400",
  },
  red: {
    border: "hover:border-red-500/50 hover:shadow-red-500/20",
    iconBg: "from-red-500/20 to-orange-500/20 group-hover:from-red-500/40 group-hover:to-orange-500/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-red-500/30",
    titleColor: "group-hover:text-red-400",
    sparkle: "text-red-400/60",
    action: "group-hover:text-red-400",
  },
  green: {
    border: "hover:border-green-500/50 hover:shadow-green-500/20",
    iconBg: "from-green-500/20 to-emerald-600/20 group-hover:from-green-500/40 group-hover:to-emerald-600/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-green-500/30",
    titleColor: "group-hover:text-green-500",
    sparkle: "text-green-500/60",
    action: "group-hover:text-green-500",
  },
  emerald: {
    border: "hover:border-emerald-500/50 hover:shadow-emerald-500/20",
    iconBg: "from-emerald-500/20 to-green-500/20 group-hover:from-emerald-500/40 group-hover:to-green-500/40",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-emerald-500/30",
    titleColor: "group-hover:text-emerald-400",
    sparkle: "text-emerald-400/60",
    action: "group-hover:text-emerald-400",
  },
  primary: {
    border: "hover:border-primary/50 hover:shadow-primary/20",
    iconBg: "from-primary/20 to-primary/40 group-hover:from-primary/40 group-hover:to-primary/60",
    iconGlow: "group-hover:shadow-lg group-hover:shadow-primary/30",
    titleColor: "group-hover:text-primary",
    sparkle: "text-primary/60",
    action: "group-hover:text-primary",
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
}: ModuleCardProps) {
  const colors = colorConfig[colorScheme];

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        "w-full glass-card p-6 animate-slide-up group text-left",
        "transition-all duration-300 ease-out",
        // Border and shadow effects
        "border border-border/50",
        colors.border,
        "hover:shadow-2xl",
        // Scale and transform on hover
        "active:scale-[0.98]",
        // Featured ring effect
        featured && "ring-2 ring-gold/20 hover:ring-gold/40",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon container with glow effect */}
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br transition-all duration-300",
            colors.iconBg,
            colors.iconGlow,
            "relative overflow-hidden"
          )}
        >
          {/* Shimmer effect on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
          {iconImage ? (
            <img src={iconImage} alt="" className="w-10 h-10 object-contain relative z-10" />
          ) : (
            <div className="relative z-10">{icon}</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3
              className={cn(
                "text-xl font-display tracking-wide transition-colors duration-300",
                colors.titleColor
              )}
            >
              {title}
            </h3>
            <Sparkles className={cn("w-4 h-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110", colors.sparkle)} />
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>

        {/* Action indicator */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-2 text-sm transition-all duration-300",
            "text-muted-foreground",
            colors.action
          )}
        >
          <span className="group-hover:translate-x-1 transition-transform duration-300">{actionText}</span>
          <span className="text-lg group-hover:translate-x-1 transition-transform duration-300 delay-75">→</span>
        </div>
      </div>

      {/* Subtle bottom highlight on hover */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "bg-gradient-to-r from-transparent via-current to-transparent",
          colors.titleColor.replace("group-hover:", "")
        )}
      />
    </button>
  );
}

// Add shimmer animation to global styles would be ideal but inline works
const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: -200% -200%; }
  100% { background-position: 200% 200%; }
}
`;

// Inject keyframes if not already present
if (typeof document !== 'undefined') {
  const styleId = 'module-card-shimmer';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shimmerKeyframes;
    document.head.appendChild(style);
  }
}
