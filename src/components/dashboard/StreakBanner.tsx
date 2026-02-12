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

      {/* Dense snowfall for cold */}
      {isCold && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <Snowflake
              key={i}
              className="absolute text-sky-300/30"
              style={{
                left: `${(i * 5.8) % 100}%`,
                top: '-8px',
                width: `${8 + (i % 4) * 3}px`,
                height: `${8 + (i % 4) * 3}px`,
                animation: `streak-snowfall ${3 + (i % 3) * 1.5}s linear infinite ${i * 0.4}s`,
                opacity: 0.15 + (i % 5) * 0.08,
              }}
            />
          ))}
          {/* Frost shimmer crystals */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`frost-${i}`}
              className="absolute rounded-full"
              style={{
                width: 3,
                height: 3,
                left: `${10 + i * 16}%`,
                top: `${20 + (i % 3) * 25}%`,
                background: 'hsl(200 80% 70% / 0.3)',
                boxShadow: '0 0 8px hsl(200 80% 70% / 0.4)',
                animation: `streak-frost-twinkle ${2 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Dense flames for hot */}
      {isHot && streak > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Rising embers */}
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={`ember-${i}`}
              className="absolute rounded-full"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                left: `${(i * 6.5) % 100}%`,
                bottom: '-4px',
                background: i % 3 === 0 ? 'hsl(37 87% 57%)' : i % 3 === 1 ? 'hsl(25 90% 55%)' : 'hsl(15 85% 50%)',
                boxShadow: `0 0 6px ${i % 2 === 0 ? 'hsl(37 87% 57% / 0.6)' : 'hsl(25 90% 55% / 0.5)'}`,
                animation: `streak-ember-rise ${2.5 + (i % 4) * 0.8}s ease-out infinite ${i * 0.25}s`,
              }}
            />
          ))}
          {/* Flame columns from bottom */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`flame-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${5 + i * 12}%`,
                width: '20px',
                height: '35px',
                background: `radial-gradient(ellipse at 50% 100%, hsl(25 90% 50% / ${0.12 + (i % 3) * 0.04}) 0%, hsl(37 87% 57% / 0.06) 40%, transparent 70%)`,
                animation: `streak-flame-sway ${1.5 + (i % 3) * 0.5}s ease-in-out infinite ${i * 0.2}s`,
                transformOrigin: 'bottom center',
              }}
            />
          ))}
          {/* Heat haze */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(0deg, hsl(25 80% 50% / 0.06) 0%, transparent 40%)',
              animation: 'streak-heat-haze 4s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes streak-snowfall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(180px) rotate(360deg); opacity: 0; }
        }
        @keyframes streak-frost-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes streak-ember-rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translateY(-120px) translateX(${Math.random() > 0.5 ? '' : '-'}8px) scale(0.2); opacity: 0; }
        }
        @keyframes streak-flame-sway {
          0%, 100% { transform: scaleY(1) scaleX(1) rotate(-2deg); opacity: 0.7; }
          50% { transform: scaleY(1.3) scaleX(0.8) rotate(2deg); opacity: 1; }
        }
        @keyframes streak-heat-haze {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

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
