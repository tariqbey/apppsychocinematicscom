import { useState, useEffect, useMemo } from "react";
import { Target, Sparkles } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface ChiefAimCountdownProps {
  byWhen: string;
  whatSummary?: string;
  className?: string;
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

export function ChiefAimCountdown({ byWhen, whatSummary, className }: ChiefAimCountdownProps) {
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

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gold/20",
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
      `}</style>

      {/* Dark cinematic background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a00] via-card to-card">
        {/* Subtle bottom fire glow */}
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

      {/* Embers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <Ember key={i} index={i} />
        ))}
      </div>

      {/* Film grain overlay */}
      <div className="absolute inset-0 film-grain pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <Target className="w-5 h-5 text-gold/70" />
          <h3 className="font-ui text-xs sm:text-sm uppercase tracking-[0.3em] text-gold/80">
            Final Scene Countdown
          </h3>
          <Sparkles className="w-4 h-4 text-gold/50 animate-pulse" />
        </div>

        {/* Countdown Numbers — massive Cormorant numerals */}
        <div className="flex items-baseline justify-center gap-4 sm:gap-8 py-2">
          {/* Days */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                textShadow: '0 0 40px hsl(37 87% 57% / 0.5), 0 0 80px hsl(37 87% 57% / 0.2)',
              }}
            >
              {days}
            </div>
            <div className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">
              Days
            </div>
          </div>

          <div className="font-display text-4xl sm:text-5xl text-gold/30 self-start mt-4 sm:mt-6">:</div>

          {/* Hours */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                textShadow: '0 0 40px hsl(37 87% 57% / 0.5), 0 0 80px hsl(37 87% 57% / 0.2)',
              }}
            >
              {hours.toString().padStart(2, '0')}
            </div>
            <div className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">
              Hours
            </div>
          </div>

          <div className="font-display text-4xl sm:text-5xl text-gold/30 self-start mt-4 sm:mt-6">:</div>

          {/* Minutes */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                textShadow: '0 0 40px hsl(37 87% 57% / 0.5), 0 0 80px hsl(37 87% 57% / 0.2)',
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
        <p className="text-center font-ui text-xs text-muted-foreground tracking-wider mt-4">
          {isPast ? "DEADLINE PASSED — TIME TO ACHIEVE" : `UNTIL ${byWhen.toUpperCase()}`}
        </p>

        {/* Goal summary as screenplay direction */}
        {whatSummary && (
          <div className="mt-6 pt-5 border-t border-gold/10">
            <p className="font-script text-base sm:text-lg text-center text-foreground/80 leading-relaxed max-w-md mx-auto">
              "{whatSummary}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
