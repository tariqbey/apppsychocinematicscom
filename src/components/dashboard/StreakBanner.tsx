import { Flame, TrendingUp, Snowflake, ThermometerSnowflake, RotateCcw } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StreakBannerProps {
  streak: number;
  bestStreak: number;
  lastActiveDate?: string | null;
  daysInactive?: number;
  onKutReset?: () => void;
}

/* Animated count-up number */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display}</>;
}

export const StreakBanner = ({ streak, bestStreak, lastActiveDate, daysInactive = 0, onKutReset }: StreakBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const getStreakStatus = (): 'hot' | 'warm' | 'cold' | 'frozen' => {
    if (!lastActiveDate) return streak > 0 ? 'warm' : 'frozen';
    const lastActive = new Date(lastActiveDate);
    const today = new Date();
    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'hot';
    if (diffDays === 1) return 'warm';
    if (diffDays <= 3) return 'cold';
    return 'frozen';
  };

  const status = getStreakStatus();
  const isHot = status === 'hot' || status === 'warm';
  const isCold = status === 'cold' || status === 'frozen';

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-500",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        isCold 
          ? 'border-sky-500/20 bg-gradient-to-r from-card via-sky-950/20 to-card' 
          : isHot && streak > 0
            ? 'border-gold/20 bg-gradient-to-r from-card via-amber-950/10 to-card'
            : 'border-border/30 bg-card'
      )}
    >
      {/* Frost overlay for cold state */}
      {isCold && (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/5 via-transparent to-sky-400/5 pointer-events-none" />
      )}

      {/* Snowflakes for cold */}
      {isCold && (
        <>
          <Snowflake className="absolute top-1 left-[15%] w-3 h-3 text-sky-400/40 animate-snowfall-drift" style={{ animationDelay: '0s' }} />
          <Snowflake className="absolute top-1 left-[55%] w-2 h-2 text-cyan-300/30 animate-snowfall-drift" style={{ animationDelay: '1.6s' }} />
          <Snowflake className="absolute top-1 left-[75%] w-2.5 h-2.5 text-blue-300/30 animate-snowfall-drift" style={{ animationDelay: '2.4s' }} />
        </>
      )}

      {/* Hot embers */}
      {isHot && streak > 0 && (
        <>
          <div className="absolute bottom-0 left-[20%] w-1 h-1 rounded-full bg-gold/50 animate-ember-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-0 left-[50%] w-1 h-1 rounded-full bg-gold/40 animate-ember-float" style={{ animationDelay: '0.7s' }} />
          <div className="absolute bottom-0 left-[75%] w-1 h-1 rounded-full bg-gold/40 animate-ember-float" style={{ animationDelay: '1.4s' }} />
        </>
      )}

      <div className="relative z-10 p-4 sm:p-5">
        {/* Box Office Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isHot && streak > 0 ? (
              <Flame className="w-4 h-4 text-gold animate-flame-flicker" />
            ) : isCold ? (
              <ThermometerSnowflake className={cn("w-4 h-4 text-sky-400", status === 'frozen' && 'animate-pulse')} />
            ) : (
              <Flame className="w-4 h-4 text-muted-foreground/40" />
            )}
            <span className={cn(
              "font-ui text-[10px] sm:text-xs uppercase tracking-[0.2em]",
              isCold ? 'text-sky-400' : isHot && streak > 0 ? 'text-gold' : 'text-muted-foreground'
            )}>
              {status === 'frozen' ? 'Production Halted' : status === 'cold' ? 'Set Cooling' : status === 'hot' ? 'Now Filming' : 'Production Status'}
            </span>
            <InfoTooltip content={
              isCold 
                ? "Your streak is cooling down! Complete your daily tasks and scorecard to reignite it." 
                : "Your streak increases each day you complete your Daily Scorecard. Aim for 90+ days!"
            } />
          </div>

          {isCold && onKutReset && (
            <Button
              onClick={onKutReset}
              size="sm"
              className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-ui text-[10px] uppercase tracking-wider px-3 py-1 h-7"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              KUT
            </Button>
          )}
        </div>

        {/* Box Office Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Consecutive Shooting Days */}
          <div className={cn(
            "p-3 sm:p-4 rounded-lg border text-center",
            isCold 
              ? 'border-sky-500/15 bg-sky-950/20'
              : isHot && streak > 0 
                ? 'border-gold/15 bg-gold/5'
                : 'border-border/20 bg-secondary/30'
          )}>
            <p className="font-ui text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
              {isCold ? 'Days Frozen' : 'Consecutive Shooting Days'}
            </p>
            <p className={cn(
              "font-display text-4xl sm:text-5xl leading-none",
              isCold ? 'text-sky-400' : isHot && streak > 0 ? 'text-gold' : 'text-muted-foreground'
            )} style={{
              textShadow: isHot && streak > 0 ? '0 0 20px hsl(37 87% 57% / 0.4)' : undefined,
            }}>
              <AnimatedNumber value={isCold ? daysInactive : streak} />
            </p>
          </div>

          {/* All-Time Best */}
          <div className="p-3 sm:p-4 rounded-lg border border-border/20 bg-secondary/30 text-center">
            <p className="font-ui text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3 inline mr-1 -mt-0.5" />
              All-Time Record
            </p>
            <p className="font-display text-4xl sm:text-5xl leading-none text-gold" style={{
              textShadow: '0 0 20px hsl(37 87% 57% / 0.3)',
            }}>
              <AnimatedNumber value={bestStreak} />
            </p>
          </div>
        </div>

        {/* Status message for cold */}
        {isCold && (
          <p className="font-script text-xs text-sky-400/70 text-center mt-3">
            {status === 'frozen' ? "Production has wrapped early. KUT and get back on script." : "The set is going cold — take action today."}
          </p>
        )}
      </div>
    </div>
  );
};
