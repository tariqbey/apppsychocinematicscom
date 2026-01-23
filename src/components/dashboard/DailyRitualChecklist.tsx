import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, LightbulbIcon, Film, ScrollText, Rocket, Moon, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { TutorialTipCard } from "@/components/community/TutorialTipCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePointsContext } from "@/contexts/PointsContext";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";

interface RitualItem {
  id: string;
  dbField: 'morning_screening' | 'script_review' | 'action_execution' | 'evening_review' | 'journal_entry';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  completed: boolean;
  color: string;
  glowColor: string;
}

interface DailyRitualChecklistProps {
  onTheaterClick: () => void;
  onScorecardClick: () => void;
  onEveningMindMovieClick?: () => void;
  onJournalClick?: () => void;
}

// Floating particle component with enhanced animation
const FloatingParticle = ({ delay, size = 2, color = "#D4AF37" }: { delay: number; size?: number; color?: string }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      left: `${Math.random() * 100}%`,
      bottom: '0%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      animation: `float-particle 3s ease-in-out infinite ${delay}s`,
    }}
  />
);

export const DailyRitualChecklist = ({ onTheaterClick, onScorecardClick, onEveningMindMovieClick, onJournalClick }: DailyRitualChecklistProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { triggerRecalculation } = usePointsContext();
  const [rituals, setRituals] = useState<RitualItem[]>([
    {
      id: "morning",
      dbField: "morning_screening",
      title: "Morning Screening",
      subtitle: "Watch your Mind Movie",
      icon: <Film className="w-6 h-6 sm:w-7 sm:h-7" />,
      completed: false,
      color: "#D4AF37",
      glowColor: "rgba(212, 175, 55, 0.4)",
    },
    {
      id: "script",
      dbField: "script_review",
      title: "Script Review",
      subtitle: "Read your Definite Chief Aim",
      icon: <ScrollText className="w-6 h-6 sm:w-7 sm:h-7" />,
      completed: false,
      color: "#22D3EE",
      glowColor: "rgba(34, 211, 238, 0.4)",
    },
    {
      id: "actions",
      dbField: "action_execution",
      title: "Action Execution",
      subtitle: "Complete 3 key tasks",
      icon: <Rocket className="w-6 h-6 sm:w-7 sm:h-7" />,
      completed: false,
      color: "#F59E0B",
      glowColor: "rgba(245, 158, 11, 0.4)",
    },
    {
      id: "evening",
      dbField: "evening_review",
      title: "Evening Session",
      subtitle: "Watch Mind Movie + Complete Scorecard",
      icon: <Moon className="w-6 h-6 sm:w-7 sm:h-7" />,
      completed: false,
      color: "#A855F7",
      glowColor: "rgba(168, 85, 247, 0.4)",
    },
    {
      id: "journal",
      dbField: "journal_entry",
      title: "Journal Entry",
      subtitle: "Reflect on your day",
      icon: <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />,
      completed: false,
      color: "#10B981",
      glowColor: "rgba(16, 185, 129, 0.4)",
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredRitual, setHoveredRitual] = useState<string | null>(null);
  const [touchedRitual, setTouchedRitual] = useState<string | null>(null);

  // Load today's ritual state from database
  useEffect(() => {
    const loadRitualState = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("daily_rituals")
        .select("*")
        .eq("user_id", user.id)
        .eq("ritual_date", today)
        .maybeSingle();

      if (data && !error) {
        setRituals(prev => prev.map(ritual => ({
          ...ritual,
          completed: data[ritual.dbField] || false
        })));
      }
      setIsLoading(false);
    };

    loadRitualState();
  }, [user]);

  const toggleRitual = async (id: string) => {
    if (!user) return;

    const ritual = rituals.find(r => r.id === id);
    if (!ritual) return;

    const newCompleted = !ritual.completed;
    const today = format(new Date(), "yyyy-MM-dd");

    // Optimistic update
    setRituals(prev =>
      prev.map(r =>
        r.id === id ? { ...r, completed: newCompleted } : r
      )
    );

    // Check if record exists first
    const { data: existing } = await supabase
      .from("daily_rituals")
      .select("id")
      .eq("user_id", user.id)
      .eq("ritual_date", today)
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing record
      const result = await supabase
        .from("daily_rituals")
        .update({ [ritual.dbField]: newCompleted })
        .eq("user_id", user.id)
        .eq("ritual_date", today);
      error = result.error;
    } else {
      // Insert new record
      const insertData = {
        user_id: user.id,
        ritual_date: today,
        morning_screening: ritual.dbField === 'morning_screening' ? newCompleted : false,
        script_review: ritual.dbField === 'script_review' ? newCompleted : false,
        action_execution: ritual.dbField === 'action_execution' ? newCompleted : false,
        evening_review: ritual.dbField === 'evening_review' ? newCompleted : false,
        journal_entry: ritual.dbField === 'journal_entry' ? newCompleted : false,
      };
      const result = await supabase
        .from("daily_rituals")
        .insert(insertData);
      error = result.error;
    }

    if (error) {
      // Revert on error
      console.error("Failed to save ritual state:", error);
      setRituals(prev =>
        prev.map(r =>
          r.id === id ? { ...r, completed: !newCompleted } : r
        )
      );
    } else {
      // Trigger points recalculation on success
      triggerRecalculation();
    }
  };

  const completedCount = rituals.filter(r => r.completed).length;
  const progress = (completedCount / rituals.length) * 100;

  const handleRitualClick = (id: string) => {
    if (id === "morning") {
      onTheaterClick();
    } else if (id === "evening") {
      // Evening session: First watch Mind Movie, then scorecard
      if (onEveningMindMovieClick) {
        onEveningMindMovieClick();
      } else {
        onScorecardClick();
      }
    } else if (id === "actions") {
      navigate("/actions");
    } else if (id === "journal") {
      if (onJournalClick) {
        onJournalClick();
      }
    }
    toggleRitual(id);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isRitualActive = (id: string) => hoveredRitual === id || touchedRitual === id;

  return (
    <div 
      className={`glass-card p-4 sm:p-6 cinematic-border space-y-4 relative overflow-hidden group transition-all duration-500 hover:border-gold/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        boxShadow: isHovered 
          ? '0 0 50px rgba(212, 175, 55, 0.25), inset 0 0 60px rgba(212, 175, 55, 0.05)'
          : '0 0 30px rgba(212, 175, 55, 0.1), inset 0 0 50px rgba(212, 175, 55, 0.03)',
        transition: 'all 0.5s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Holographic scan lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.03)_50%)] bg-[length:100%_4px]"
          style={{
            animation: 'scan-line 8s linear infinite',
          }}
        />
      </div>

      {/* Animated border glow effect */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
          animation: 'holographic-shimmer 3s ease-in-out infinite',
        }}
      />

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/3 via-transparent to-gold/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingParticle delay={0} size={3} />
        <FloatingParticle delay={0.5} size={2} />
        <FloatingParticle delay={1} size={4} />
        <FloatingParticle delay={1.5} size={2} />
        <FloatingParticle delay={2} size={3} />
      </div>

      {/* Sparkle particles */}
      <Sparkles className="absolute top-3 right-12 w-3 h-3 text-gold/40 animate-pulse pointer-events-none" />
      <Sparkles className="absolute bottom-4 right-24 w-2 h-2 text-amber-soft/30 animate-pulse pointer-events-none" style={{ animationDelay: '0.7s' }} />
      <Sparkles className="absolute top-8 right-6 w-2 h-2 text-gold/30 animate-pulse pointer-events-none" style={{ animationDelay: '1.3s' }} />

      {/* Weekly Calendar Header */}
      <WeeklyCalendarHeader />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              boxShadow: isHovered ? '0 0 20px rgba(212, 175, 55, 0.4)' : '0 0 10px rgba(212, 175, 55, 0.2)',
            }}
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
          </div>
          <h3 className="text-xl sm:text-2xl font-display tracking-wide">Daily Ritual</h3>
          <InfoTooltip content="Your daily ritual is the foundation of transformation. Morning: Watch Mind Movie + Read Chief Aim. Midday: Complete 3 key tasks. Evening: Score yourself honestly on the scorecard." />
        </div>
        <span className="text-sm sm:text-base text-muted-foreground font-medium bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
          {completedCount}/{rituals.length}
        </span>
      </div>

      {/* Tutorial Tip - Enhanced visibility */}
      <div className="relative">
        <TutorialTipCard
          id="daily-ritual-tips"
          title="Master Your Daily Ritual"
          variant="gold"
          icon={<LightbulbIcon className="w-6 h-6" />}
          tips={[
            "☀️ Morning Screening: Watch your Mind Movie first thing to prime your subconscious for success",
            "📜 Script Review: Read your Definite Chief Aim aloud with emotion and conviction",
            "🚀 Action Execution: Complete your 3 key tasks that move you toward your Chief Aim",
            "🌙 Evening Session: Watch your Mind Movie AGAIN before bed + complete your Director Scorecard",
            "📓 Journal Entry: Reflect on wins, lessons learned, and tomorrow's intentions",
            "🔥 Complete ALL 5 rituals daily to build an unstoppable streak and transform your identity!",
          ]}
        />
      </div>

      {/* Progress bar with glow */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-500 rounded-full"
          style={{ 
            width: `${progress}%`,
            boxShadow: progress > 0 ? '0 0 15px rgba(212, 175, 55, 0.6)' : undefined,
          }}
        />
      </div>

      {/* Ritual Buttons - Enhanced with ModuleCard-style animations */}
      <div className="space-y-3 sm:space-y-4 relative z-10">
        {rituals.map((ritual, index) => {
          const isActive = isRitualActive(ritual.id) || (isMobile && isVisible);
          
          return (
            <button
              key={ritual.id}
              onClick={() => handleRitualClick(ritual.id)}
              onMouseEnter={() => setHoveredRitual(ritual.id)}
              onMouseLeave={() => setHoveredRitual(null)}
              onTouchStart={() => setTouchedRitual(ritual.id)}
              onTouchEnd={() => setTimeout(() => setTouchedRitual(null), 200)}
              disabled={isLoading}
              className={cn(
                "w-full relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl transition-all duration-500 group/item text-left overflow-hidden",
                "border-2",
                ritual.completed
                  ? "bg-gradient-to-br from-gold/15 via-gold/10 to-transparent border-gold/40"
                  : "bg-gradient-to-br from-card/80 via-card/60 to-card/40 border-border/40 hover:border-gold/40",
                isLoading && "opacity-50",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
              style={{ 
                animationDelay: `${index * 0.1}s`,
                transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
                opacity: isVisible ? 1 : 0,
                transition: `all 0.4s ease ${index * 0.08}s`,
                boxShadow: isActive 
                  ? `0 0 30px ${ritual.glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)` 
                  : ritual.completed 
                    ? '0 0 20px rgba(212, 175, 55, 0.2)' 
                    : 'none',
              }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none">
                <div className={cn(
                  "absolute top-0 left-0 w-full h-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to right, transparent, ${ritual.color}, transparent)` }} />
                <div className={cn(
                  "absolute top-0 left-0 h-full w-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to bottom, transparent, ${ritual.color}, transparent)` }} />
              </div>
              <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none">
                <div className={cn(
                  "absolute top-0 right-0 w-full h-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to left, transparent, ${ritual.color}, transparent)` }} />
                <div className={cn(
                  "absolute top-0 right-0 h-full w-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to bottom, transparent, ${ritual.color}, transparent)` }} />
              </div>
              <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none">
                <div className={cn(
                  "absolute bottom-0 left-0 w-full h-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to right, transparent, ${ritual.color}, transparent)` }} />
                <div className={cn(
                  "absolute bottom-0 left-0 h-full w-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to top, transparent, ${ritual.color}, transparent)` }} />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none">
                <div className={cn(
                  "absolute bottom-0 right-0 w-full h-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to left, transparent, ${ritual.color}, transparent)` }} />
                <div className={cn(
                  "absolute bottom-0 right-0 h-full w-[2px] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )} style={{ background: `linear-gradient(to top, transparent, ${ritual.color}, transparent)` }} />
              </div>

              {/* Scanning line animation */}
              <div className={cn(
                "absolute inset-0 transition-opacity duration-300 pointer-events-none overflow-hidden",
                isActive ? "opacity-100" : "opacity-0"
              )}>
                <div 
                  className="absolute h-[1px] w-full"
                  style={{
                    background: `linear-gradient(to right, transparent, ${ritual.color}, transparent)`,
                    animation: isActive ? 'scan-line 2s ease-in-out infinite' : 'none',
                  }}
                />
              </div>

              {/* Floating particles */}
              <div className={cn(
                "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500",
                isActive ? "opacity-100" : "opacity-0"
              )}>
                {[0, 0.5, 1, 1.5].map((delay, i) => (
                  <FloatingParticle key={i} color={ritual.color} delay={delay} size={2} />
                ))}
              </div>

              {/* Holographic shimmer */}
              <div 
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 pointer-events-none",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                style={{
                  background: `linear-gradient(
                    105deg,
                    transparent 40%,
                    rgba(255,255,255,0.03) 45%,
                    rgba(255,255,255,0.05) 50%,
                    rgba(255,255,255,0.03) 55%,
                    transparent 60%
                  )`,
                  backgroundSize: '200% 100%',
                  animation: isActive ? 'holographic-shimmer 2s ease-in-out infinite' : 'none',
                }}
              />

              {/* Icon container with enhanced glow */}
              <div
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 relative overflow-hidden",
                  ritual.completed
                    ? "bg-gradient-to-br from-gold to-amber-soft text-primary-foreground"
                    : "bg-gradient-to-br from-secondary to-secondary/50 text-muted-foreground group-hover/item:text-foreground"
                )}
                style={{
                  boxShadow: ritual.completed 
                    ? '0 0 30px rgba(212, 175, 55, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.3)' 
                    : isActive 
                      ? `0 0 25px ${ritual.glowColor}` 
                      : '0 0 10px rgba(0,0,0,0.2)',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {/* Pulsing ring */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-xl transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    border: `1px solid ${ritual.color}`,
                    animation: isActive ? 'pulse-ring 1.5s ease-out infinite' : 'none',
                  }}
                />

                {/* Inner glow */}
                <div 
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `radial-gradient(circle at center, ${ritual.glowColor} 0%, transparent 70%)`,
                    opacity: isActive ? 0.6 : 0.2,
                    transition: 'opacity 0.5s',
                  }}
                />

                {/* Rotating border */}
                <div 
                  className={cn(
                    "absolute inset-[-2px] rounded-xl transition-opacity pointer-events-none",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${ritual.color}, transparent)`,
                    animation: isActive ? 'rotate-border 3s linear infinite' : 'none',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'xor',
                    WebkitMaskComposite: 'xor',
                    padding: '2px',
                  }}
                />

                {ritual.completed ? <Check className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" /> : <span className="relative z-10">{ritual.icon}</span>}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={cn(
                    "font-display text-base sm:text-lg tracking-wide transition-colors truncate",
                    ritual.completed && "text-gold",
                    isActive && !ritual.completed && "text-foreground"
                  )}>
                    {ritual.title}
                  </p>
                  <Sparkles 
                    className={cn(
                      "w-4 h-4 transition-all duration-500 flex-shrink-0",
                      isActive && "rotate-12 scale-125",
                    )} 
                    style={{
                      color: ritual.color,
                      filter: isActive ? `drop-shadow(0 0 4px ${ritual.color})` : 'none',
                    }}
                  />
                  <Zap 
                    className={cn(
                      "w-3 h-3 transition-all duration-300 animate-pulse flex-shrink-0",
                      isActive ? "opacity-100" : "opacity-0"
                    )} 
                    style={{ color: ritual.color }}
                  />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground truncate">{ritual.subtitle}</p>
              </div>

              {/* Completion indicator */}
              {ritual.completed && (
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 border border-gold/30"
                  style={{
                    animation: 'pulse-ring 2s ease-in-out infinite',
                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                  }}
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                </div>
              )}

              {/* Action arrow for incomplete */}
              {!ritual.completed && (
                <div className={cn(
                  "hidden sm:flex items-center gap-2 text-sm transition-all duration-500 text-muted-foreground",
                  isActive && "text-gold"
                )}>
                  <span 
                    className={cn(
                      "text-lg transition-all duration-300",
                      isActive && "translate-x-2 scale-125"
                    )}
                    style={{
                      filter: isActive ? `drop-shadow(0 0 6px ${ritual.color})` : 'none',
                    }}
                  >
                    →
                  </span>
                </div>
              )}

              {/* Bottom energy bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
                <div 
                  className={cn(
                    "h-full w-0 transition-all duration-700 ease-out",
                    isActive && "w-full"
                  )}
                  style={{
                    background: `linear-gradient(to right, transparent, ${ritual.color}, transparent)`,
                    boxShadow: `0 0 10px ${ritual.color}`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Weekly calendar header component
function WeeklyCalendarHeader() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday start

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
    <div className="mb-4 relative z-10">
      {/* Current date display */}
      <div className="text-center mb-3">
        <p className="text-lg sm:text-xl font-display text-gold">
          {format(today, "EEEE")}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {format(today, "MMMM d, yyyy")}
        </p>
      </div>

      {/* Week days row */}
      <div className="flex items-center justify-between gap-1 px-1">
        {weekDays.map((day) => (
          <div
            key={day.dayNum}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 sm:px-3 rounded-lg transition-all duration-300 flex-1",
              day.isToday
                ? "bg-gradient-to-br from-gold/30 to-amber-soft/20 border-2 border-gold/50 shadow-lg"
                : "bg-secondary/30 border border-border/30"
            )}
            style={{
              boxShadow: day.isToday ? "0 0 15px rgba(212, 175, 55, 0.3)" : undefined,
            }}
          >
            <span
              className={cn(
                "text-[10px] sm:text-xs uppercase tracking-wider font-medium",
                day.isToday ? "text-gold" : "text-muted-foreground"
              )}
            >
              {day.dayName}
            </span>
            <span
              className={cn(
                "text-sm sm:text-lg font-display",
                day.isToday ? "text-gold" : "text-foreground/70"
              )}
            >
              {day.dayNum}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}