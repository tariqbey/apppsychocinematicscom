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
        "relative overflow-hidden rounded-xl border transition-all duration-700",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        isCold 
          ? 'border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-card to-cyan-950/30' 
          : isHot && streak > 0
            ? 'border-gold/30 bg-gradient-to-br from-amber-950/40 via-card to-orange-950/20'
            : 'border-border/30 bg-gradient-to-br from-card via-card to-secondary/30'
      )}
    >
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isCold
            ? 'radial-gradient(ellipse at 30% 20%, hsl(200 80% 50% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(190 80% 50% / 0.06) 0%, transparent 60%)'
            : isHot && streak > 0
              ? 'radial-gradient(ellipse at 30% 20%, hsl(37 87% 57% / 0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(25 90% 50% / 0.06) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 50% 50%, hsl(37 87% 57% / 0.03) 0%, transparent 60%)',
          animation: 'streak-bg-drift 8s ease-in-out infinite',
        }}
      />

      {/* Top accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px]",
        isCold 
          ? "bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" 
          : "bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      )} />

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
          <div className="absolute bottom-0 left-[20%] w-1.5 h-1.5 rounded-full bg-gold/60 animate-ember-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-0 left-[40%] w-1 h-1 rounded-full bg-amber-400/50 animate-ember-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-0 left-[60%] w-1 h-1 rounded-full bg-gold/40 animate-ember-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-[80%] w-1.5 h-1.5 rounded-full bg-orange-400/40 animate-ember-float" style={{ animationDelay: '1.5s' }} />
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
            "relative p-3 sm:p-4 rounded-lg border text-center overflow-hidden group/stat",
            isCold 
              ? 'border-sky-500/20 bg-gradient-to-b from-sky-950/40 to-sky-950/20'
              : isHot && streak > 0 
                ? 'border-gold/20 bg-gradient-to-b from-gold/8 to-gold/3'
                : 'border-border/20 bg-gradient-to-b from-secondary/40 to-secondary/20'
          )}>
            {/* Inner glow */}
            <div className={cn(
              "absolute inset-0 rounded-lg pointer-events-none",
              isCold ? "bg-radial-gradient" : ""
            )} style={{
              background: isCold 
                ? 'radial-gradient(circle at 50% 80%, hsl(200 80% 50% / 0.1) 0%, transparent 70%)'
                : isHot && streak > 0
                  ? 'radial-gradient(circle at 50% 80%, hsl(37 87% 57% / 0.1) 0%, transparent 70%)'
                  : 'none',
            }} />
            <p className="font-ui text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 relative z-10">
              {isCold ? 'Days Frozen' : 'Consecutive Shooting Days'}
            </p>
            <p className={cn(
              "font-display text-4xl sm:text-5xl leading-none relative z-10",
              isCold ? 'text-sky-400' : isHot && streak > 0 ? 'text-gold' : 'text-muted-foreground'
            )} style={{
              textShadow: isCold
                ? '0 0 25px hsl(200 80% 50% / 0.5)'
                : isHot && streak > 0 
                  ? '0 0 25px hsl(37 87% 57% / 0.5)' 
                  : undefined,
            }}>
              <AnimatedNumber value={isCold ? daysInactive : streak} />
            </p>
          </div>

          {/* All-Time Best */}
          <div className="relative p-3 sm:p-4 rounded-lg border border-gold/15 bg-gradient-to-b from-gold/8 to-gold/3 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle at 50% 80%, hsl(37 87% 57% / 0.08) 0%, transparent 70%)',
            }} />
            <p className="font-ui text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 relative z-10">
              <TrendingUp className="w-3 h-3 inline mr-1 -mt-0.5 text-gold/60" />
              All-Time Record
            </p>
            <p className="font-display text-4xl sm:text-5xl leading-none text-gold relative z-10" style={{
              textShadow: '0 0 25px hsl(37 87% 57% / 0.5)',
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

      {/* Bottom accent */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-[2px]",
        isCold 
          ? "bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" 
          : "bg-gradient-to-r from-transparent via-gold/30 to-transparent"
      )} />
    </div>
  );
};
