import { useMemo } from "react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export function WeeklyCalendarStrip() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });

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
    <div className="rounded-xl border border-border/30 bg-card p-4 sm:p-5 animate-fade-in">
      {/* Current date */}
      <div className="text-center mb-3">
        <p className="font-display text-lg sm:text-xl text-gold">
          {format(today, "EEEE")}
        </p>
        <p className="font-ui text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.15em]">
          {format(today, "MMMM d, yyyy")}
        </p>
      </div>

      {/* Week days row */}
      <div className="flex items-center justify-between gap-1">
        {weekDays.map((day) => (
          <div
            key={day.dayNum}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-1 sm:px-2.5 rounded-lg transition-all duration-300 flex-1",
              day.isToday
                ? "bg-gold/10 border border-gold/30"
                : "bg-secondary/20 border border-transparent"
            )}
          >
            <span className={cn(
              "font-ui text-[9px] sm:text-[10px] uppercase tracking-wider",
              day.isToday ? "text-gold" : "text-muted-foreground"
            )}>
              {day.dayName}
            </span>
            <span className={cn(
              "font-display text-sm sm:text-base",
              day.isToday ? "text-gold" : "text-foreground/60"
            )}>
              {day.dayNum}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
