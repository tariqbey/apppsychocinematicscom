import { useState, useEffect, useMemo } from "react";
import { Target, Sparkles, Snowflake } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface ChiefAimCountdownProps {
  byWhen: string;
  whatSummary?: string;
  className?: string;
  streakStatus?: 'hot' | 'warm' | 'cold' | 'frozen';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
}

function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const formats = [
    "MMMM d, yyyy",
    "MMMM dd, yyyy",
    "MMM d, yyyy",
    "MMM dd, yyyy",
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "M/d/yyyy",
  ];
  
  for (const format of formats) {
    try {
      const parsed = parse(dateStr, format, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      // Continue to next format
    }
  }
  
  const fallback = new Date(dateStr);
  return isValid(fallback) ? fallback : null;
}

function getTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date();
  const isPast = targetDate < now;
  
  const totalDays = Math.abs(differenceInDays(targetDate, now));
  const totalHours = Math.abs(differenceInHours(targetDate, now)) % 24;
  const totalMinutes = Math.abs(differenceInMinutes(targetDate, now)) % 60;
  
  return {
    days: totalDays,
    hours: totalHours,
    minutes: totalMinutes,
    isPast,
  };
}

/* Pure CSS ember particle */
function Ember({ index }: { index: number }) {
  const left = 8 + (index * 7.5);
  const delay = index * 0.35;
  const drift = (Math.random() - 0.5) * 50;
  const size = 1.5 + Math.random() * 2;

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        bottom: '10%',
        left: `${left}%`,
        background: 'hsl(37 87% 57%)',
        boxShadow: '0 0 6px hsl(37 87% 57% / 0.8), 0 0 12px hsl(14 90% 41% / 0.4)',
        animationName: 'countdown-ember',
        animationDuration: `${3 + Math.random() * 2}s`,
        animationTimingFunction: 'ease-out',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}s`,
        ['--drift' as string]: `${drift}px`,
      }}
    />
  );
}

/* Pure CSS snowflake particle */
function SnowParticle({ index }: { index: number }) {
  const left = 5 + (index * 8);
  const delay = index * 0.5;
  const drift = (Math.random() - 0.5) * 40;
  const size = 2 + Math.random() * 3;

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top: '-5%',
        left: `${left}%`,
        background: 'hsl(200 80% 85%)',
        boxShadow: '0 0 6px hsl(200 80% 85% / 0.8), 0 0 12px hsl(210 90% 70% / 0.4)',
        animationName: 'countdown-snowfall',
        animationDuration: `${4 + Math.random() * 3}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}s`,
        ['--snow-drift' as string]: `${drift}px`,
      }}
    />
  );
}

export function ChiefAimCountdown({ byWhen, whatSummary, className, streakStatus = 'warm' }: ChiefAimCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  const targetDate = useMemo(() => parseFlexibleDate(byWhen), [byWhen]);

  useEffect(() => {
    if (!targetDate) return;

    const updateTime = () => {
      setTimeRemaining(getTimeRemaining(targetDate));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!byWhen || !byWhen.trim()) {
    return null;
  }

  if (!targetDate) {
    return (
      <div className={cn("rounded-2xl border border-gold/30 bg-card/60 p-4 text-center", className)}>
        <p className="text-sm text-muted-foreground">
          📅 Your deadline date couldn't be parsed: <span className="text-gold">"{byWhen}"</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try a format like "January 1, 2027" or "2027-01-01"
        </p>
      </div>
    );
  }

  if (!timeRemaining) {
    return null;
  }

  const { days, hours, minutes, isPast } = timeRemaining;
  const isHot = streakStatus === 'hot' || streakStatus === 'warm';
  const isCold = streakStatus === 'cold' || streakStatus === 'frozen';

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        isCold ? "border-sky-500/20" : "border-gold/20",
        className
      )}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes countdown-ember {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) translateX(var(--drift)) scale(0.2); opacity: 0; }
        }
        @keyframes countdown-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes countdown-flame-sway {
          0%, 100% { transform: scaleX(1) scaleY(1); }
          33% { transform: scaleX(0.95) scaleY(1.05); }
          66% { transform: scaleX(1.05) scaleY(0.97); }
        }
        @keyframes countdown-snowfall {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(50%) translateX(var(--snow-drift)) scale(0.9); opacity: 1; }
          100% { transform: translateY(120px) translateX(calc(var(--snow-drift) * -1)) scale(0.3); opacity: 0; }
        }
        @keyframes countdown-frost-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes countdown-ice-shimmer {
          0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.15; }
          33% { transform: scaleX(1.02) scaleY(0.98); opacity: 0.25; }
          66% { transform: scaleX(0.98) scaleY(1.02); opacity: 0.2; }
        }
      `}</style>

      {/* === HOT / WARM: Fire background === */}
      {isHot && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a00] via-card to-card">
          {/* Bottom fire glow */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/2"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, hsl(37 87% 57% / 0.15) 0%, hsl(14 90% 41% / 0.08) 40%, transparent 70%)',
              animation: 'countdown-glow 4s ease-in-out infinite',
            }}
          />
          
          {/* Soft flame shapes at bottom */}
          {[15, 30, 50, 70, 85].map((pos, i) => (
            <div
              key={i}
              className="absolute bottom-0"
              style={{
                left: `${pos}%`,
                width: '60px',
                height: `${40 + i * 8}px`,
                background: `linear-gradient(to top, hsl(37 87% 57% / 0.2) 0%, hsl(14 90% 41% / 0.1) 50%, transparent 100%)`,
                filter: 'blur(12px)',
                borderRadius: '50% 50% 0 0',
                animation: `countdown-flame-sway ${2.5 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
                transformOrigin: 'bottom center',
              }}
            />
          ))}
        </div>
      )}

      {/* === COLD / FROZEN: Ice background === */}
      {isCold && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1220] via-card to-[#0a1220]">
          {/* Top frost glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-1/2"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, hsl(200 80% 70% / 0.12) 0%, hsl(210 90% 50% / 0.06) 40%, transparent 70%)',
              animation: 'countdown-frost-pulse 5s ease-in-out infinite',
            }}
          />
          
          {/* Bottom frost glow */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/3"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, hsl(200 80% 70% / 0.08) 0%, transparent 60%)',
              animation: 'countdown-frost-pulse 6s ease-in-out infinite',
              animationDelay: '2s',
            }}
          />

          {/* Ice crystal shapes */}
          {[10, 25, 45, 65, 85].map((pos, i) => (
            <div
              key={i}
              className="absolute top-0"
              style={{
                left: `${pos}%`,
                width: '50px',
                height: `${30 + i * 6}px`,
                background: `linear-gradient(to bottom, hsl(200 80% 85% / 0.15) 0%, hsl(210 90% 70% / 0.06) 50%, transparent 100%)`,
                filter: 'blur(10px)',
                borderRadius: '0 0 50% 50%',
                animation: `countdown-ice-shimmer ${3 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
                transformOrigin: 'top center',
              }}
            />
          ))}
        </div>
      )}

      {/* Hot embers */}
      {isHot && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <Ember key={i} index={i} />
          ))}
        </div>
      )}

      {/* Cold snowflakes */}
      {isCold && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <SnowParticle key={i} index={i} />
          ))}
          {/* Floating snowflake icons */}
          <Snowflake className="absolute top-3 left-[12%] w-3 h-3 text-sky-400/30 animate-pulse" style={{ animationDelay: '0s' }} />
          <Snowflake className="absolute top-5 left-[60%] w-2.5 h-2.5 text-cyan-300/25 animate-pulse" style={{ animationDelay: '1.5s' }} />
          <Snowflake className="absolute top-4 left-[82%] w-2 h-2 text-blue-300/20 animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
      )}

      {/* Film grain overlay */}
      <div className="absolute inset-0 film-grain pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <Target className={cn("w-5 h-5", isCold ? "text-sky-400/70" : "text-gold/70")} />
          <h3 className={cn(
            "font-ui text-xs sm:text-sm uppercase tracking-[0.3em]",
            isCold ? "text-sky-400/80" : "text-gold/80"
          )}>
            Final Scene Countdown
          </h3>
          {isHot && <Sparkles className="w-4 h-4 text-gold/50 animate-pulse" />}
          {isCold && <Snowflake className="w-4 h-4 text-sky-400/50 animate-pulse" />}
        </div>

        {/* Countdown Numbers */}
        <div className="flex items-baseline justify-center gap-4 sm:gap-8 py-2">
          {/* Days */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                textShadow: isCold 
                  ? '0 0 40px hsl(200 80% 70% / 0.5), 0 0 80px hsl(200 80% 70% / 0.2)'
                  : '0 0 40px hsl(37 87% 57% / 0.5), 0 0 80px hsl(37 87% 57% / 0.2)',
              }}
            >
              {days}
            </div>
            <div className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">
              Days
            </div>
          </div>

          <div className={cn(
            "font-display text-4xl sm:text-5xl self-start mt-4 sm:mt-6",
            isCold ? "text-sky-400/30" : "text-gold/30"
          )}>:</div>

          {/* Hours */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                textShadow: isCold 
                  ? '0 0 40px hsl(200 80% 70% / 0.5), 0 0 80px hsl(200 80% 70% / 0.2)'
                  : '0 0 40px hsl(37 87% 57% / 0.5), 0 0 80px hsl(37 87% 57% / 0.2)',
              }}
            >
              {hours.toString().padStart(2, '0')}
            </div>
            <div className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">
              Hours
            </div>
          </div>

          <div className={cn(
            "font-display text-4xl sm:text-5xl self-start mt-4 sm:mt-6",
            isCold ? "text-sky-400/30" : "text-gold/30"
          )}>:</div>

          {/* Minutes */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                textShadow: isCold 
                  ? '0 0 40px hsl(200 80% 70% / 0.5), 0 0 80px hsl(200 80% 70% / 0.2)'
                  : '0 0 40px hsl(37 87% 57% / 0.5), 0 0 80px hsl(37 87% 57% / 0.2)',
              }}
            >
              {minutes.toString().padStart(2, '0')}
            </div>
            <div className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">
              Min
            </div>
          </div>
        </div>

        {/* Deadline label */}
        <p className={cn(
          "text-center font-ui text-xs tracking-wider mt-4",
          isCold ? "text-sky-400/70" : "text-muted-foreground"
        )}>
          {isPast ? "DEADLINE PASSED — TIME TO ACHIEVE" : `UNTIL ${byWhen.toUpperCase()}`}
        </p>

        {/* Cold status message */}
        {isCold && (
          <p className="text-center font-script text-xs text-sky-400/60 mt-2 italic">
            {streakStatus === 'frozen' ? "Production halted — reignite your streak" : "The set is cooling — get back on script"}
          </p>
        )}

        {/* Goal summary as screenplay direction */}
        {whatSummary && (
          <div className={cn(
            "mt-6 pt-5 border-t",
            isCold ? "border-sky-400/10" : "border-gold/10"
          )}>
            <p className="font-script text-base sm:text-lg text-center text-foreground/80 leading-relaxed max-w-md mx-auto">
              "{whatSummary}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
