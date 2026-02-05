 import { useState, useEffect, useMemo } from "react";
 import { Target, Sparkles, Zap, Clock } from "lucide-react";
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
   
   // Try various common formats
   const formats = [
     "MMMM d, yyyy",     // December 31, 2026
     "MMMM dd, yyyy",    // December 31, 2026
     "MMM d, yyyy",      // Dec 31, 2026
     "MMM dd, yyyy",     // Dec 31, 2026
     "yyyy-MM-dd",       // 2026-12-31
     "MM/dd/yyyy",       // 12/31/2026
     "M/d/yyyy",         // 12/31/2026
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
   
   // Fallback: try native Date parsing
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
   const [isHovered, setIsHovered] = useState(false);
 
   const targetDate = useMemo(() => parseFlexibleDate(byWhen), [byWhen]);
 
   useEffect(() => {
     if (!targetDate) return;
 
     const updateTime = () => {
       setTimeRemaining(getTimeRemaining(targetDate));
     };
 
     updateTime();
     const interval = setInterval(updateTime, 60000); // Update every minute
 
     return () => clearInterval(interval);
   }, [targetDate]);
 
   if (!targetDate || !timeRemaining) {
     return null;
   }
 
   const { days, hours, minutes, isPast } = timeRemaining;
 
   return (
     <div
       className={cn(
         "glass-card p-5 sm:p-6 cinematic-border relative overflow-hidden group transition-all duration-500",
         isPast ? "border-amber-500/30 hover:border-amber-500/50" : "border-gold/30 hover:border-gold/50",
         className
       )}
       style={{
         boxShadow: isHovered
           ? '0 0 40px rgba(212, 175, 55, 0.25)'
           : '0 0 20px rgba(212, 175, 55, 0.1)',
       }}
       onMouseEnter={() => setIsHovered(true)}
       onMouseLeave={() => setIsHovered(false)}
     >
       {/* Background effects */}
       <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.03)_50%)] bg-[length:100%_4px]" />
       </div>
       
       <Sparkles className="absolute top-3 right-8 w-3 h-3 text-gold/40 animate-pulse" />
       <Sparkles className="absolute top-6 right-4 w-2 h-2 text-gold/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
 
       {/* Header */}
       <div className="flex items-center gap-3 mb-4 relative z-10">
         <div className={cn(
           "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300",
           isPast 
             ? "bg-gradient-to-br from-amber-500/20 to-orange-600/20" 
             : "bg-gradient-to-br from-gold/30 to-amber-500/20"
         )} style={{
           boxShadow: isHovered ? '0 0 20px rgba(212, 175, 55, 0.4)' : 'none',
         }}>
           <Target className={cn("w-5 h-5 sm:w-6 sm:h-6", isPast ? "text-amber-500" : "text-gold")} />
         </div>
         <div>
           <h3 className="text-lg sm:text-xl font-display tracking-wide flex items-center gap-2">
             Final Scene Countdown
             <Zap className="w-4 h-4 text-gold animate-pulse" />
           </h3>
           <p className="text-xs sm:text-sm text-muted-foreground">
             {isPast ? "Deadline passed - time to achieve!" : `Until ${byWhen}`}
           </p>
         </div>
       </div>
 
       {/* Countdown Display */}
       <div className="flex items-center justify-center gap-2 sm:gap-4 py-4 relative z-10">
         {/* Days */}
         <div className="text-center">
           <div className={cn(
             "text-4xl sm:text-5xl md:text-6xl font-display tracking-wider tabular-nums",
             isPast ? "text-amber-400" : "text-gold"
           )} style={{
             textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
           }}>
             {days}
           </div>
           <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">
             Days
           </div>
         </div>
 
         <div className="text-2xl sm:text-3xl text-gold/50 font-light">:</div>
 
         {/* Hours */}
         <div className="text-center">
           <div className={cn(
             "text-4xl sm:text-5xl md:text-6xl font-display tracking-wider tabular-nums",
             isPast ? "text-amber-400" : "text-gold"
           )} style={{
             textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
           }}>
             {hours.toString().padStart(2, '0')}
           </div>
           <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">
             Hours
           </div>
         </div>
 
         <div className="text-2xl sm:text-3xl text-gold/50 font-light">:</div>
 
         {/* Minutes */}
         <div className="text-center">
           <div className={cn(
             "text-4xl sm:text-5xl md:text-6xl font-display tracking-wider tabular-nums",
             isPast ? "text-amber-400" : "text-gold"
           )} style={{
             textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
           }}>
             {minutes.toString().padStart(2, '0')}
           </div>
           <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">
             Min
           </div>
         </div>
       </div>
 
       {/* Goal summary */}
       {whatSummary && (
         <div className="mt-4 pt-4 border-t border-border/30 relative z-10">
           <p className="text-sm text-center text-muted-foreground line-clamp-2">
             "{whatSummary}"
           </p>
         </div>
       )}
     </div>
   );
 }