import { Flame, TrendingUp, Sparkles } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

interface StreakBannerProps {
  streak: number;
  bestStreak: number;
}

export const StreakBanner = ({ streak, bestStreak }: StreakBannerProps) => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`glass-card p-4 cinematic-border flex items-center justify-between relative overflow-hidden group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        boxShadow: streak > 0 ? '0 0 20px rgba(245, 158, 11, 0.15), inset 0 0 30px rgba(245, 158, 11, 0.05)' : undefined,
      }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-soft/5 via-transparent to-amber-soft/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating sparkles */}
      {streak > 0 && (
        <>
          <Sparkles className="absolute top-2 right-20 w-3 h-3 text-amber-soft/40 animate-pulse" />
          <Sparkles className="absolute bottom-3 right-32 w-2 h-2 text-gold/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-soft/20 to-cinematic-red/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${streak > 0 ? 'animate-pulse' : ''}`}>
          <Flame className={`w-5 h-5 sm:w-6 sm:h-6 text-amber-soft ${streak > 0 ? 'streak-fire' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">Current Streak</p>
            <InfoTooltip content="Your streak increases each day you complete your Daily Scorecard. Consecutive days build momentum and reinforce your new identity. Aim for 90+ days!" />
          </div>
          <p className="text-xl sm:text-2xl font-display text-foreground group-hover:text-amber-soft transition-colors duration-300">{streak} Days</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Best</span>
          </div>
          <p className="text-lg sm:text-xl font-display text-gold">{bestStreak} Days</p>
        </div>
      </div>
    </div>
  );
};
