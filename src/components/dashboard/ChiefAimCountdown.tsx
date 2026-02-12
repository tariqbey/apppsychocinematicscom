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

/* Pure CSS ember particle — spread across full height */
function Ember({ index, total }: { index: number; total: number }) {
  const left = 3 + (index / total) * 94;
  const delay = index * 0.25;
  const drift = (Math.random() - 0.5) * 60;
  const size = 1.5 + Math.random() * 2.5;
  const startBottom = Math.random() * 30; // embers start from various heights

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        bottom: `${startBottom}%`,
        left: `${left}%`,
        background: `hsl(${30 + Math.random() * 15} ${80 + Math.random() * 10}% ${50 + Math.random() * 15}%)`,
        boxShadow: `0 0 ${4 + Math.random() * 6}px hsl(37 87% 57% / 0.9), 0 0 ${10 + Math.random() * 8}px hsl(14 90% 41% / 0.5)`,
        animationName: 'countdown-ember',
        animationDuration: `${2.5 + Math.random() * 3}s`,
        animationTimingFunction: 'ease-out',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}s`,
        ['--drift' as string]: `${drift}px`,
        ['--rise' as string]: `${150 + Math.random() * 100}px`,
      }}
    />
  );
}

/* Pure CSS snowflake particle — spread across full height */
function SnowParticle({ index, total }: { index: number; total: number }) {
  const left = 2 + (index / total) * 96;
  const delay = index * 0.35;
  const drift = (Math.random() - 0.5) * 50;
  const size = 1.5 + Math.random() * 3;

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top: `${-2 + Math.random() * 5}%`,
        left: `${left}%`,
        background: `hsl(${195 + Math.random() * 15} ${70 + Math.random() * 15}% ${80 + Math.random() * 10}%)`,
        boxShadow: `0 0 ${4 + Math.random() * 4}px hsl(200 80% 85% / 0.8), 0 0 ${8 + Math.random() * 6}px hsl(210 90% 70% / 0.4)`,
        animationName: 'countdown-snowfall',
        animationDuration: `${3.5 + Math.random() * 4}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}s`,
        ['--snow-drift' as string]: `${drift}px`,
        ['--snow-fall' as string]: `${180 + Math.random() * 100}px`,
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
          60% { opacity: 0.6; }
          100% { transform: translateY(calc(var(--rise, 150px) * -1)) translateX(var(--drift)) scale(0.1); opacity: 0; }
        }
        @keyframes countdown-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes countdown-flame-sway {
          0%, 100% { transform: scaleX(1) scaleY(1); }
          33% { transform: scaleX(0.92) scaleY(1.08); }
          66% { transform: scaleX(1.08) scaleY(0.94); }
        }
        @keyframes countdown-heat-haze {
          0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.04; }
          50% { transform: translateY(-8px) scaleY(1.02); opacity: 0.08; }
        }
        @keyframes countdown-snowfall {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(calc(var(--snow-fall, 150px) * 0.5)) translateX(var(--snow-drift)) scale(0.85); opacity: 1; }
          100% { transform: translateY(var(--snow-fall, 150px)) translateX(calc(var(--snow-drift) * -1)) scale(0.2); opacity: 0; }
        }
        @keyframes countdown-frost-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes countdown-ice-shimmer {
          0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.15; }
          33% { transform: scaleX(1.03) scaleY(0.97); opacity: 0.3; }
          66% { transform: scaleX(0.97) scaleY(1.03); opacity: 0.2; }
        }
        @keyframes countdown-number-fire-glow {
          0%, 100% { text-shadow: 0 0 30px hsl(37 87% 57% / 0.4), 0 0 60px hsl(37 87% 57% / 0.15), 0 2px 4px hsl(0 0% 0% / 0.5); }
          50% { text-shadow: 0 0 50px hsl(37 87% 57% / 0.6), 0 0 100px hsl(14 90% 41% / 0.25), 0 2px 4px hsl(0 0% 0% / 0.5); }
        }
        @keyframes countdown-number-ice-glow {
          0%, 100% { text-shadow: 0 0 30px hsl(200 80% 70% / 0.4), 0 0 60px hsl(210 90% 60% / 0.15), 0 2px 4px hsl(0 0% 0% / 0.5); }
          50% { text-shadow: 0 0 50px hsl(200 80% 70% / 0.6), 0 0 100px hsl(200 80% 85% / 0.25), 0 2px 4px hsl(0 0% 0% / 0.5); }
        }
      `}</style>

      {/* === HOT / WARM: Fire background === */}
      {isHot && (
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(20_80%_4%)] via-card to-card">
          {/* Full-height fire glow — covers numbers area */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-full"
            style={{
              background: 'radial-gradient(ellipse at 50% 85%, hsl(37 87% 57% / 0.18) 0%, hsl(14 90% 41% / 0.1) 30%, transparent 65%)',
              animation: 'countdown-glow 3.5s ease-in-out infinite',
            }}
          />
          {/* Mid-height ambient warmth */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-3/4"
            style={{
              background: 'radial-gradient(ellipse at 30% 70%, hsl(37 87% 57% / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, hsl(14 90% 41% / 0.06) 0%, transparent 50%)',
              animation: 'countdown-glow 5s ease-in-out infinite',
              animationDelay: '1.5s',
            }}
          />

          {/* Heat haze layers over numbers */}
          {[30, 50, 70].map((pos, i) => (
            <div
              key={`haze-${i}`}
              className="absolute"
              style={{
                left: `${pos - 10}%`,
                bottom: '20%',
                width: '20%',
                height: '60%',
                background: 'linear-gradient(to top, hsl(37 87% 57% / 0.04) 0%, transparent 100%)',
                filter: 'blur(20px)',
                animation: `countdown-heat-haze ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
          
          {/* Tall flame columns */}
          {[8, 20, 35, 50, 65, 80, 92].map((pos, i) => (
            <div
              key={i}
              className="absolute bottom-0"
              style={{
                left: `${pos}%`,
                width: `${50 + i * 5}px`,
                height: `${60 + i * 15}px`,
                background: `linear-gradient(to top, hsl(37 87% 57% / 0.25) 0%, hsl(14 90% 41% / 0.12) 40%, hsl(37 87% 57% / 0.04) 70%, transparent 100%)`,
                filter: 'blur(14px)',
                borderRadius: '50% 50% 0 0',
                animation: `countdown-flame-sway ${2 + i * 0.25}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                transformOrigin: 'bottom center',
              }}
            />
          ))}
        </div>
      )}

      {/* === COLD / FROZEN: Ice background === */}
      {isCold && (
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(210_40%_7%)] via-card to-[hsl(210_40%_7%)]">
          {/* Full frost glow — covers entire module */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, hsl(200 80% 70% / 0.1) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, hsl(200 80% 70% / 0.06) 0%, transparent 50%)',
              animation: 'countdown-frost-pulse 5s ease-in-out infinite',
            }}
          />
          {/* Side frost accents */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 10% 50%, hsl(210 90% 60% / 0.06) 0%, transparent 40%), radial-gradient(ellipse at 90% 50%, hsl(210 90% 60% / 0.06) 0%, transparent 40%)',
              animation: 'countdown-frost-pulse 6s ease-in-out infinite',
              animationDelay: '2.5s',
            }}
          />

          {/* Ice crystal shapes — top and bottom */}
          {[5, 18, 35, 50, 65, 82, 95].map((pos, i) => (
            <div
              key={i}
              className="absolute top-0"
              style={{
                left: `${pos}%`,
                width: `${40 + i * 5}px`,
                height: `${25 + i * 8}px`,
                background: `linear-gradient(to bottom, hsl(200 80% 85% / 0.18) 0%, hsl(210 90% 70% / 0.06) 50%, transparent 100%)`,
                filter: 'blur(10px)',
                borderRadius: '0 0 50% 50%',
                animation: `countdown-ice-shimmer ${2.5 + i * 0.35}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
                transformOrigin: 'top center',
              }}
            />
          ))}
          {/* Bottom frost crystals */}
          {[12, 40, 70, 88].map((pos, i) => (
            <div
              key={`bottom-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${pos}%`,
                width: `${35 + i * 6}px`,
                height: `${20 + i * 5}px`,
                background: `linear-gradient(to top, hsl(200 80% 85% / 0.12) 0%, transparent 100%)`,
                filter: 'blur(8px)',
                borderRadius: '50% 50% 0 0',
                animation: `countdown-ice-shimmer ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.6 + 1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Hot embers — many more, full coverage */}
      {isHot && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <Ember key={i} index={i} total={24} />
          ))}
        </div>
      )}

      {/* Cold snowflakes — many more, full coverage */}
      {isCold && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <SnowParticle key={i} index={i} total={20} />
          ))}
          {/* Floating snowflake icons scattered throughout */}
          {[
            { top: '10%', left: '8%', size: 'w-3 h-3', opacity: '30' },
            { top: '25%', left: '85%', size: 'w-2.5 h-2.5', opacity: '20' },
            { top: '45%', left: '15%', size: 'w-2 h-2', opacity: '25' },
            { top: '40%', left: '75%', size: 'w-3.5 h-3.5', opacity: '15' },
            { top: '60%', left: '55%', size: 'w-2 h-2', opacity: '20' },
            { top: '75%', left: '25%', size: 'w-2.5 h-2.5', opacity: '25' },
            { top: '80%', left: '90%', size: 'w-2 h-2', opacity: '15' },
          ].map((s, i) => (
            <Snowflake
              key={`icon-${i}`}
              className={`absolute ${s.size} animate-pulse`}
              style={{
                top: s.top,
                left: s.left,
                color: `hsl(200 80% 70% / 0.${s.opacity})`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${2 + i * 0.3}s`,
              }}
            />
          ))}
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
                animation: isCold ? 'countdown-number-ice-glow 4s ease-in-out infinite' : 'countdown-number-fire-glow 3s ease-in-out infinite',
              }}
            >
              {days}
            </div>
            <div className={cn(
              "font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] mt-2",
              isCold ? "text-sky-300/60" : "text-gold/60"
            )}>
              Days
            </div>
          </div>

          <div className={cn(
            "font-display text-4xl sm:text-5xl self-start mt-4 sm:mt-6 animate-pulse",
            isCold ? "text-sky-400/30" : "text-gold/30"
          )} style={{ animationDuration: '2s' }}>:</div>

          {/* Hours */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                animation: isCold ? 'countdown-number-ice-glow 4s ease-in-out infinite 0.5s' : 'countdown-number-fire-glow 3s ease-in-out infinite 0.5s',
              }}
            >
              {hours.toString().padStart(2, '0')}
            </div>
            <div className={cn(
              "font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] mt-2",
              isCold ? "text-sky-300/60" : "text-gold/60"
            )}>
              Hours
            </div>
          </div>

          <div className={cn(
            "font-display text-4xl sm:text-5xl self-start mt-4 sm:mt-6 animate-pulse",
            isCold ? "text-sky-400/30" : "text-gold/30"
          )} style={{ animationDuration: '2s', animationDelay: '1s' }}>:</div>

          {/* Minutes */}
          <div className="text-center">
            <div 
              className="font-display text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums text-foreground"
              style={{
                animation: isCold ? 'countdown-number-ice-glow 4s ease-in-out infinite 1s' : 'countdown-number-fire-glow 3s ease-in-out infinite 1s',
              }}
            >
              {minutes.toString().padStart(2, '0')}
            </div>
            <div className={cn(
              "font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] mt-2",
              isCold ? "text-sky-300/60" : "text-gold/60"
            )}>
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
