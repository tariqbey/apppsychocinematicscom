import { useMemo, useState, useEffect } from "react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export function WeeklyCalendarStrip() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayNum: format(date, "d"),
        dayName: format(date, "EEE"),
        isToday: isToday(date),
      };
    });
  }, [weekStart]);

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/30 bg-card p-4 sm:p-5 overflow-hidden transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      {/* Subtle gold shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(37 87% 57% / 0.06) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'calendar-shimmer 4s ease-in-out infinite',
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Current date with icon */}
      <div className="text-center mb-3 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <Calendar className="w-4 h-4 text-gold/60 animate-pulse" style={{ animationDuration: '3s' }} />
          <p className="font-display text-lg sm:text-xl text-gold-gradient">
            {format(today, "EEEE")}
          </p>
        </div>
        <p className="font-ui text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.15em]">
          {format(today, "MMMM d, yyyy")}
        </p>
      </div>

      {/* Week days row */}
      <div className="flex items-center justify-between gap-1 relative z-10">
        {weekDays.map((day, i) => (
          <div
            key={day.dayNum}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-1 sm:px-2.5 rounded-lg transition-all duration-500 flex-1",
              day.isToday
                ? "bg-gold/10 border border-gold/30 shadow-[0_0_12px_hsl(37_87%_57%/0.15)]"
                : "bg-secondary/20 border border-transparent hover:bg-secondary/30 hover:border-border/30"
            )}
            style={{
              transitionDelay: isVisible ? `${i * 60}ms` : '0ms',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <span className={cn(
              "font-ui text-[9px] sm:text-[10px] uppercase tracking-wider transition-colors duration-300",
              day.isToday ? "text-gold" : "text-muted-foreground"
            )}>
              {day.dayName}
            </span>
            <span className={cn(
              "font-display text-sm sm:text-base transition-all duration-300",
              day.isToday ? "text-gold scale-110" : "text-foreground/60"
            )}>
              {day.dayNum}
            </span>
            {day.isToday && (
              <div className="w-1 h-1 rounded-full bg-gold mt-0.5 animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </div>
  );
}
