import { Flame, TrendingUp, Sparkles, Snowflake, ThermometerSnowflake } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

interface StreakBannerProps {
  streak: number;
  bestStreak: number;
  lastActiveDate?: string | null;
}

export const StreakBanner = ({ streak, bestStreak, lastActiveDate }: StreakBannerProps) => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Determine if streak is "hot" (active today/yesterday) or "cold" (inactive 2+ days)
  const getStreakStatus = (): 'hot' | 'warm' | 'cold' | 'frozen' => {
    if (!lastActiveDate) return streak > 0 ? 'warm' : 'frozen';
    
    const lastActive = new Date(lastActiveDate);
    const today = new Date();
    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hot'; // Active today
    if (diffDays === 1) return 'warm'; // Active yesterday
    if (diffDays <= 3) return 'cold'; // 2-3 days inactive
    return 'frozen'; // 4+ days inactive
  };

  const status = getStreakStatus();
  const isHot = status === 'hot' || status === 'warm';
  const isCold = status === 'cold' || status === 'frozen';

  return (
    <div 
      className={`glass-card p-4 cinematic-border flex items-center justify-between relative overflow-hidden group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        boxShadow: isHot && streak > 0 
          ? '0 0 20px rgba(245, 158, 11, 0.15), inset 0 0 30px rgba(245, 158, 11, 0.05)' 
          : isCold 
            ? '0 0 20px rgba(56, 189, 248, 0.15), inset 0 0 30px rgba(56, 189, 248, 0.05)'
            : undefined,
      }}
    >
      {/* Animated background - hot or cold */}
      {isHot && streak > 0 && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-soft/5 via-transparent to-amber-soft/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      {isCold && (
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/5 via-transparent to-cyan-400/5 opacity-60 animate-pulse" />
      )}
      
      {/* Floating sparkles for hot streak */}
      {isHot && streak > 0 && (
        <>
          <Sparkles className="absolute top-2 right-20 w-3 h-3 text-amber-soft/40 animate-pulse" />
          <Sparkles className="absolute bottom-3 right-32 w-2 h-2 text-gold/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      {/* Floating snowflakes for cold streak */}
      {isCold && (
        <>
          <Snowflake className="absolute top-2 right-16 w-3 h-3 text-sky-400/50 animate-bounce" style={{ animationDuration: '2s' }} />
          <Snowflake className="absolute bottom-2 right-28 w-2 h-2 text-cyan-300/40 animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '2.5s' }} />
          <Snowflake className="absolute top-3 right-36 w-2 h-2 text-blue-300/30 animate-bounce" style={{ animationDelay: '1.2s', animationDuration: '3s' }} />
          {status === 'frozen' && (
            <>
              <Snowflake className="absolute top-4 left-20 w-2 h-2 text-sky-300/40 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.2s' }} />
              <Snowflake className="absolute bottom-3 left-32 w-3 h-3 text-cyan-400/30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.8s' }} />
            </>
          )}
        </>
      )}

      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
          isHot && streak > 0 
            ? 'bg-gradient-to-br from-amber-soft/20 to-cinematic-red/20 animate-pulse' 
            : isCold 
              ? 'bg-gradient-to-br from-sky-400/20 to-cyan-500/20'
              : 'bg-gradient-to-br from-muted/30 to-muted/10'
        }`}>
          {isHot && streak > 0 ? (
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-soft streak-fire" />
          ) : isCold ? (
            <ThermometerSnowflake className={`w-5 h-5 sm:w-6 sm:h-6 text-sky-400 ${status === 'frozen' ? 'animate-pulse' : ''}`} />
          ) : (
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-xs sm:text-sm uppercase tracking-wider ${
              isCold ? 'text-sky-400' : 'text-muted-foreground'
            }`}>
              {status === 'frozen' ? '❄️ Streak Frozen' : status === 'cold' ? '🥶 Streak Cooling' : 'Current Streak'}
            </p>
            <InfoTooltip content={
              isCold 
                ? "Your streak is cooling down! Complete your daily tasks and scorecard to reignite it. Streaks are based on consistent daily action!" 
                : "Your streak increases each day you complete your Daily Scorecard. Consecutive days build momentum and reinforce your new identity. Aim for 90+ days!"
            } />
          </div>
          <p className={`text-xl sm:text-2xl font-display transition-colors duration-300 ${
            isHot && streak > 0 
              ? 'text-foreground group-hover:text-amber-soft' 
              : isCold 
                ? 'text-sky-400'
                : 'text-muted-foreground'
          }`}>
            {streak} Days {isCold && <span className="text-sm text-muted-foreground">(inactive)</span>}
          </p>
          {isCold && (
            <p className="text-xs text-sky-400/70 mt-0.5">
              {status === 'frozen' ? "Complete tasks today to thaw your streak!" : "Take action today to heat things up!"}
            </p>
          )}
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
