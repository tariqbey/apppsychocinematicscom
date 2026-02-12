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
        "relative rounded-xl border border-gold/15 overflow-hidden transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{
        background: 'linear-gradient(135deg, hsl(240 5% 8%) 0%, hsl(37 87% 57% / 0.04) 50%, hsl(240 5% 8%) 100%)',
      }}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, hsl(37 87% 57% / 0.08) 0%, transparent 70%)',
      }} />

      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(37 87% 57% / 0.06) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'calendar-shimmer 4s ease-in-out infinite',
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative z-10 p-4 sm:p-5">
        {/* Current date with icon */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <Calendar className="w-4 h-4 text-gold/70 animate-pulse" style={{ animationDuration: '3s' }} />
            <p className="font-display text-lg sm:text-xl text-gold-gradient">
              {format(today, "EEEE")}
            </p>
          </div>
          <p className="font-ui text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.15em]">
            {format(today, "MMMM d, yyyy")}
          </p>
        </div>

        {/* Week days row */}
        <div className="flex items-center justify-between gap-1">
          {weekDays.map((day, i) => (
            <div
              key={day.dayNum}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 sm:px-2.5 rounded-lg transition-all duration-500 flex-1",
                day.isToday
                  ? "bg-gradient-to-b from-gold/15 to-gold/5 border border-gold/40"
                  : "bg-secondary/20 border border-transparent hover:bg-secondary/30 hover:border-gold/10"
              )}
              style={{
                transitionDelay: isVisible ? `${i * 60}ms` : '0ms',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                boxShadow: day.isToday ? '0 0 15px hsl(37 87% 57% / 0.15), inset 0 0 10px hsl(37 87% 57% / 0.05)' : 'none',
              }}
            >
              <span className={cn(
                "font-ui text-[9px] sm:text-[10px] uppercase tracking-wider transition-colors duration-300",
                day.isToday ? "text-gold font-bold" : "text-muted-foreground"
              )}>
                {day.dayName}
              </span>
              <span className={cn(
                "font-display text-base sm:text-lg transition-all duration-300",
                day.isToday ? "text-gold" : "text-foreground/50"
              )} style={{
                textShadow: day.isToday ? '0 0 12px hsl(37 87% 57% / 0.5)' : 'none',
              }}>
                {day.dayNum}
              </span>
              {day.isToday && (
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-0.5 animate-pulse" style={{
                  boxShadow: '0 0 6px hsl(37 87% 57% / 0.6)',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
    </div>
  );
}
