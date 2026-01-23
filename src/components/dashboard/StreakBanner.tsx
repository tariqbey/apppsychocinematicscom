import { Flame, TrendingUp, Sparkles, Snowflake, ThermometerSnowflake, RotateCcw } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface StreakBannerProps {
  streak: number;
  bestStreak: number;
  lastActiveDate?: string | null;
  onKutReset?: () => void;
}

export const StreakBanner = ({ streak, bestStreak, lastActiveDate, onKutReset }: StreakBannerProps) => {
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
      className={`glass-card p-4 cinematic-border flex items-center justify-between relative overflow-hidden group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isCold ? 'animate-frost-pulse' : isHot && streak > 0 ? 'animate-fire-glow' : ''}`}
    >
      {/* Frost overlay for cold state */}
      {isCold && (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-cyan-400/5 to-blue-500/10 animate-frost-creep pointer-events-none" />
      )}
      
      {/* Ice shimmer effect */}
      {status === 'frozen' && (
        <div className="absolute inset-0 animate-ice-shimmer pointer-events-none" />
      )}

      {/* Fire gradient for hot state */}
      {isHot && streak > 0 && (
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-orange-400/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      {/* Floating embers for hot streak */}
      {isHot && streak > 0 && (
        <>
          <div className="absolute bottom-0 left-[20%] w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-ember-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-0 left-[40%] w-1 h-1 rounded-full bg-orange-400/50 animate-ember-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-0 left-[60%] w-1 h-1 rounded-full bg-red-400/40 animate-ember-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-[75%] w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-ember-float" style={{ animationDelay: '1.5s' }} />
          <Sparkles className="absolute top-2 right-20 w-3 h-3 text-amber-500/50 animate-pulse" />
          <Sparkles className="absolute bottom-3 right-32 w-2 h-2 text-gold/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      {/* Falling snowflakes for cold streak */}
      {isCold && (
        <>
          <Snowflake className="absolute top-0 left-[15%] w-3 h-3 text-sky-400/60 animate-snowfall-drift" style={{ animationDelay: '0s' }} />
          <Snowflake className="absolute top-0 left-[35%] w-2 h-2 text-cyan-300/50 animate-snowfall-drift" style={{ animationDelay: '0.8s' }} />
          <Snowflake className="absolute top-0 left-[55%] w-2.5 h-2.5 text-blue-300/40 animate-snowfall-drift" style={{ animationDelay: '1.6s' }} />
          <Snowflake className="absolute top-0 left-[75%] w-2 h-2 text-sky-300/50 animate-snowfall-drift" style={{ animationDelay: '2.4s' }} />
          {status === 'frozen' && (
            <>
              <Snowflake className="absolute top-0 left-[25%] w-2 h-2 text-cyan-400/40 animate-snowfall-drift" style={{ animationDelay: '0.4s' }} />
              <Snowflake className="absolute top-0 left-[65%] w-3 h-3 text-blue-400/50 animate-snowfall-drift" style={{ animationDelay: '1.2s' }} />
              <Snowflake className="absolute top-0 left-[85%] w-2 h-2 text-sky-300/40 animate-snowfall-drift" style={{ animationDelay: '2s' }} />
            </>
          )}
        </>
      )}

      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
          isHot && streak > 0 
            ? 'bg-gradient-to-br from-amber-500/30 to-red-500/20' 
            : isCold 
              ? 'bg-gradient-to-br from-sky-400/30 to-cyan-500/20'
              : 'bg-gradient-to-br from-muted/30 to-muted/10'
        }`}>
          {isHot && streak > 0 ? (
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 animate-flame-flicker" />
          ) : isCold ? (
            <ThermometerSnowflake className={`w-5 h-5 sm:w-6 sm:h-6 text-sky-400 ${status === 'frozen' ? 'animate-pulse' : ''}`} />
          ) : (
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-xs sm:text-sm uppercase tracking-wider font-medium ${
              isCold ? 'text-sky-400' : isHot && streak > 0 ? 'text-amber-500' : 'text-muted-foreground'
            }`}>
              {status === 'frozen' ? '❄️ Streak Frozen' : status === 'cold' ? '🥶 Streak Cooling' : status === 'hot' ? '🔥 On Fire!' : 'Current Streak'}
            </p>
            <InfoTooltip content={
              isCold 
                ? "Your streak is cooling down! Complete your daily tasks and scorecard to reignite it. Streaks are based on consistent daily action!" 
                : "Your streak increases each day you complete your Daily Scorecard. Consecutive days build momentum and reinforce your new identity. Aim for 90+ days!"
            } />
          </div>
          <p className={`text-xl sm:text-2xl font-display transition-colors duration-300 ${
            isHot && streak > 0 
              ? 'text-amber-500 group-hover:text-amber-400' 
              : isCold 
                ? 'text-sky-400'
                : 'text-muted-foreground'
          }`}>
            {streak} Days {isCold && <span className="text-sm text-sky-400/70">(inactive)</span>}
          </p>
          {isCold && (
            <p className="text-xs text-sky-400/70 mt-0.5">
              {status === 'frozen' ? "You're frozen! KUT reset and get back on script!" : "Take action today to heat things up!"}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 relative z-10">
        {/* KUT Reset Button - Only shows when cold */}
        {isCold && onKutReset && (
          <Button
            onClick={onKutReset}
            size="sm"
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-bold text-xs px-3 py-1 h-auto shadow-lg shadow-sky-500/20 animate-pulse"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            KUT
          </Button>
        )}
        
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
