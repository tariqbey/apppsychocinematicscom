import { useState, useEffect, useMemo } from "react";
import { Target, Sparkles, Zap } from "lucide-react";
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

  if (!targetDate || !timeRemaining) {
    return null;
  }

  const { days, hours, minutes, isPast } = timeRemaining;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gold/40",
        className
      )}
    >
      {/* Fire Animation Styles */}
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes rise {
          0% { transform: translateY(100%) scale(1); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100%) scale(0.8); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(255, 100, 0, 0.4), 0 0 80px rgba(255, 50, 0, 0.2); }
          50% { box-shadow: 0 0 60px rgba(255, 100, 0, 0.6), 0 0 100px rgba(255, 50, 0, 0.3); }
        }
        @keyframes ember {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
          100% { transform: translateY(-150px) translateX(var(--drift)) scale(0.3); opacity: 0; }
        }
        .fire-container {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .flame {
          animation: rise 3s ease-out infinite;
        }
        .flame-1 { animation-delay: 0s; left: 10%; }
        .flame-2 { animation-delay: 0.5s; left: 25%; }
        .flame-3 { animation-delay: 1s; left: 40%; }
        .flame-4 { animation-delay: 1.5s; left: 55%; }
        .flame-5 { animation-delay: 2s; left: 70%; }
        .flame-6 { animation-delay: 2.5s; left: 85%; }
        .ember {
          animation: ember 4s ease-out infinite;
        }
      `}</style>

      {/* Fire Background Container */}
      <div className="fire-container absolute inset-0 bg-gradient-to-t from-orange-900/90 via-red-900/70 to-black/90">
        {/* Base fire glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 via-red-600/20 to-transparent" />
        
        {/* Animated flames */}
        <div className="absolute bottom-0 left-0 right-0 h-full overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`flame flame-${i} absolute bottom-0 w-16 sm:w-24`}
              style={{
                background: `linear-gradient(to top, 
                  rgba(255, 200, 50, 0.9) 0%, 
                  rgba(255, 120, 0, 0.8) 30%, 
                  rgba(255, 50, 0, 0.6) 60%, 
                  rgba(200, 0, 0, 0.3) 80%, 
                  transparent 100%)`,
                height: `${60 + Math.random() * 40}%`,
                filter: 'blur(8px)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              }}
            />
          ))}
        </div>

        {/* Embers/Sparks */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="ember absolute w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-orange-400"
            style={{
              bottom: '20%',
              left: `${10 + (i * 7)}%`,
              animationDelay: `${i * 0.3}s`,
              ['--drift' as string]: `${(Math.random() - 0.5) * 40}px`,
              boxShadow: '0 0 6px rgba(255, 150, 0, 0.8)',
            }}
          />
        ))}

        {/* Heat distortion overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center bottom, rgba(255, 100, 0, 0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gold/40 to-orange-500/30 flex items-center justify-center backdrop-blur-sm border border-gold/30">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
          </div>
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-display tracking-wider flex items-center gap-2 text-white">
              FINAL SCENE COUNTDOWN
              <Zap className="w-4 h-4 text-gold animate-pulse" />
            </h3>
            <p className="text-xs sm:text-sm text-orange-200/80">
              {isPast ? "Deadline passed - time to achieve!" : `Until ${byWhen}`}
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-gold/60 animate-pulse" />
        </div>

        {/* Countdown Numbers */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 py-4 sm:py-6">
          {/* Days */}
          <div className="text-center">
            <div 
              className="text-5xl sm:text-6xl md:text-7xl font-display tracking-wider tabular-nums text-gold"
              style={{
                textShadow: '0 0 30px rgba(255, 150, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.5)',
              }}
            >
              {days}
            </div>
            <div className="text-xs sm:text-sm text-orange-200/80 uppercase tracking-widest mt-1 font-medium">
              Days
            </div>
          </div>

          <div className="text-3xl sm:text-4xl text-gold/60 font-light animate-pulse">:</div>

          {/* Hours */}
          <div className="text-center">
            <div 
              className="text-5xl sm:text-6xl md:text-7xl font-display tracking-wider tabular-nums text-gold"
              style={{
                textShadow: '0 0 30px rgba(255, 150, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.5)',
              }}
            >
              {hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs sm:text-sm text-orange-200/80 uppercase tracking-widest mt-1 font-medium">
              Hours
            </div>
          </div>

          <div className="text-3xl sm:text-4xl text-gold/60 font-light animate-pulse">:</div>

          {/* Minutes */}
          <div className="text-center">
            <div 
              className="text-5xl sm:text-6xl md:text-7xl font-display tracking-wider tabular-nums text-gold"
              style={{
                textShadow: '0 0 30px rgba(255, 150, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.5)',
              }}
            >
              {minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs sm:text-sm text-orange-200/80 uppercase tracking-widest mt-1 font-medium">
              Min
            </div>
          </div>
        </div>

        {/* Goal summary */}
        {whatSummary && (
          <div className="mt-4 pt-4 border-t border-orange-500/30">
            <p className="text-sm sm:text-base text-center text-orange-100/90 line-clamp-2 font-medium">
              "{whatSummary}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
