import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LightbulbIcon, Film, ScrollText, Rocket, Moon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { TutorialTipCard } from "@/components/community/TutorialTipCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePointsContext } from "@/contexts/PointsContext";
import { format } from "date-fns";
import { ScriptReviewModal } from "./ScriptReviewModal";
import { EveningReviewModal } from "./EveningReviewModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface RitualItem {
  id: string;
  dbField: 'morning_screening' | 'script_review' | 'action_execution' | 'evening_review' | 'journal_entry';
  title: string;
  subtitle: string;
  sceneNumber: string;
  icon: React.ReactNode;
  completed: boolean;
  color: string;
}

interface DailyRitualChecklistProps {
  onTheaterClick: () => void;
  onScorecardClick: () => void;
  onEveningMindMovieClick?: () => void;
  onJournalClick?: () => void;
  onScriptReviewClick?: () => void;
  chiefAim?: {
    what: string;
    byWhen: string;
    exchange: string;
    plan: string;
  };
  chiefAimSongUrl?: string | null;
  onEditChiefAim?: () => void;
  onAdjustChiefAim?: () => void;
  onSongListened?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRitualProgressChange?: () => void;
}

export const DailyRitualChecklist = ({ 
  onTheaterClick, 
  onScorecardClick, 
  onEveningMindMovieClick, 
  onJournalClick,
  onScriptReviewClick,
  chiefAim,
  chiefAimSongUrl,
  onEditChiefAim,
  onAdjustChiefAim,
  onSongListened,
  isOpen = false,
  onOpenChange,
  onRitualProgressChange,
}: DailyRitualChecklistProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRecalculation } = usePointsContext();
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showEveningModal, setShowEveningModal] = useState(false);
  const [rituals, setRituals] = useState<RitualItem[]>([
    {
      id: "morning",
      dbField: "morning_screening",
      title: "Morning Screening",
      subtitle: "Watch your Mind Movie",
      sceneNumber: "01",
      icon: <Film className="w-5 h-5" />,
      completed: false,
      color: "hsl(37 87% 57%)",
    },
    {
      id: "script",
      dbField: "script_review",
      title: "Script Review",
      subtitle: "Read your Definite Chief Aim",
      sceneNumber: "02",
      icon: <ScrollText className="w-5 h-5" />,
      completed: false,
      color: "hsl(187 92% 53%)",
    },
    {
      id: "actions",
      dbField: "action_execution",
      title: "Action Execution",
      subtitle: "Complete 3 key tasks",
      sceneNumber: "03",
      icon: <Rocket className="w-5 h-5" />,
      completed: false,
      color: "hsl(37 87% 57%)",
    },
    {
      id: "evening",
      dbField: "evening_review",
      title: "Evening Session",
      subtitle: "Watch Mind Movie + Complete Scorecard",
      sceneNumber: "04",
      icon: <Moon className="w-5 h-5" />,
      completed: false,
      color: "hsl(271 81% 56%)",
    },
    {
      id: "journal",
      dbField: "journal_entry",
      title: "Journal Entry",
      subtitle: "Reflect on your day",
      sceneNumber: "05",
      icon: <BookOpen className="w-5 h-5" />,
      completed: false,
      color: "hsl(160 84% 39%)",
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Check action execution completion based on tasks
  const checkActionExecution = async (userId: string, today: string) => {
    const { data: tasks } = await supabase
      .from("daily_tasks")
      .select("id, is_completed, incomplete_reason")
      .eq("user_id", userId)
      .eq("task_date", today);

    if (!tasks || tasks.length === 0) return false;

    // All tasks must be either completed OR have an excuse logged
    return tasks.every(t => t.is_completed || (t.incomplete_reason && t.incomplete_reason.trim() !== ""));
  };

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

      // Check action execution from tasks
      const actionsComplete = await checkActionExecution(user.id, today);

      // If action_execution status changed, sync it to the DB
      if (data && data.action_execution !== actionsComplete) {
        await supabase
          .from("daily_rituals")
          .update({ action_execution: actionsComplete })
          .eq("user_id", user.id)
          .eq("ritual_date", today);
      }

      if (data && !error) {
        setRituals(prev => prev.map(ritual => ({
          ...ritual,
          completed: ritual.id === "actions" ? actionsComplete : (data[ritual.dbField] || false)
        })));
      } else {
        // No ritual row yet — still reflect action status
        setRituals(prev => prev.map(ritual => ({
          ...ritual,
          completed: ritual.id === "actions" ? actionsComplete : false
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

    setRituals(prev =>
      prev.map(r =>
        r.id === id ? { ...r, completed: newCompleted } : r
      )
    );

    const { data: existing } = await supabase
      .from("daily_rituals")
      .select("id")
      .eq("user_id", user.id)
      .eq("ritual_date", today)
      .maybeSingle();

    let error;
    if (existing) {
      const result = await supabase
        .from("daily_rituals")
        .update({ [ritual.dbField]: newCompleted })
        .eq("user_id", user.id)
        .eq("ritual_date", today);
      error = result.error;
    } else {
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
      console.error("Failed to save ritual state:", error);
      setRituals(prev =>
        prev.map(r =>
          r.id === id ? { ...r, completed: !newCompleted } : r
        )
      );
    } else {
      triggerRecalculation();
      onRitualProgressChange?.();
    }
  };

  const completedCount = rituals.filter(r => r.completed).length;
  const progress = (completedCount / rituals.length) * 100;
  const nextStepIndex = rituals.findIndex(r => !r.completed);

  const handleRitualClick = (id: string) => {
    if (id === "morning") {
      onOpenChange?.(false);
      setTimeout(() => onTheaterClick(), 150);
      toggleRitual(id);
      return;
    } else if (id === "evening") {
      setShowEveningModal(true);
      return;
    } else if (id === "actions") {
      onOpenChange?.(false);
      setTimeout(() => navigate("/actions"), 150);
      return;
    } else if (id === "journal") {
      if (onJournalClick) {
        onOpenChange?.(false);
        setTimeout(() => onJournalClick(), 150);
      }
      return;
    } else if (id === "script") {
      if (onScriptReviewClick) {
        onScriptReviewClick();
      } else {
        setShowScriptModal(true);
      }
      return;
    }
    toggleRitual(id);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScriptRitualComplete = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data: existing } = await supabase
      .from("daily_rituals")
      .select("id")
      .eq("user_id", user.id)
      .eq("ritual_date", today)
      .maybeSingle();
    
    if (existing) {
      await supabase
        .from("daily_rituals")
        .update({ script_review: true })
        .eq("user_id", user.id)
        .eq("ritual_date", today);
    } else {
      await supabase
        .from("daily_rituals")
        .insert({
          user_id: user.id,
          ritual_date: today,
          script_review: true,
        });
    }
    
    setRituals(prev =>
      prev.map(r => r.id === "script" ? { ...r, completed: true } : r)
    );
    triggerRecalculation();
    onRitualProgressChange?.();
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 rounded-none p-0 bg-background border-none overflow-y-auto data-[state=open]:slide-in-from-bottom-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100">
        {/* Sticky nav header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/30">
          <button
            onClick={() => onOpenChange?.(false)}
            className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <span className="text-lg">←</span> Back
          </button>
          <span className="font-display text-base text-gold">Daily Ritual</span>
          <button
            onClick={() => onOpenChange?.(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-gold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="max-w-lg mx-auto w-full">
        {/* Cinematic Progress Ring Header */}
        <div className="px-5 pt-8 pb-6 flex flex-col items-center">
          {/* Circular progress ring */}
          <div className="relative w-32 h-32 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background ring */}
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="hsl(var(--secondary) / 0.3)"
                strokeWidth="6"
              />
              {/* Progress ring */}
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: progress > 0 ? 'drop-shadow(0 0 8px hsl(37 87% 57% / 0.5))' : undefined,
                }}
              />
              {/* Segment markers */}
              {rituals.map((_, i) => {
                const angle = (i / rituals.length) * 360 - 90;
                const rad = (angle * Math.PI) / 180;
                const x = 60 + 52 * Math.cos(rad);
                const y = 60 + 52 * Math.sin(rad);
                return (
                  <circle
                    key={i}
                    cx={x} cy={y} r="3"
                    fill={rituals[i].completed ? "hsl(37 87% 57%)" : "hsl(var(--muted-foreground) / 0.3)"}
                    className="transition-all duration-500"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  />
                );
              })}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(37 87% 57%)" />
                  <stop offset="100%" stopColor="hsl(37 87% 70%)" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-display text-gold transition-all duration-700"
                style={{
                  textShadow: completedCount === rituals.length ? '0 0 20px hsl(37 87% 57% / 0.6)' : undefined,
                }}
              >
                {completedCount}/{rituals.length}
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                Scenes
              </span>
            </div>
            {/* Breathing glow when all complete */}
            {completedCount === rituals.length && (
              <div className="absolute inset-0 rounded-full animate-pulse" style={{
                background: 'radial-gradient(circle, hsl(37 87% 57% / 0.15) 0%, transparent 70%)',
              }} />
            )}
          </div>

          <h3 className="font-display text-2xl tracking-wide text-foreground">Daily Ritual</h3>
          <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {completedCount === rituals.length
              ? "✦ All scenes wrapped ✦"
              : `${rituals.length - completedCount} scene${rituals.length - completedCount !== 1 ? 's' : ''} remaining`}
          </p>

          {/* Linear progress bar below */}
          <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden mt-4">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(37 87% 57%), hsl(37 87% 70%))',
                boxShadow: progress > 0 ? '0 0 12px hsl(37 87% 57% / 0.5)' : undefined,
              }}
            />
          </div>
        </div>

        {/* Tutorial Tip */}
        <div className="px-5">
          <TutorialTipCard
            id="daily-ritual-tips"
            title="Master Your Daily Ritual"
            variant="gold"
            icon={<LightbulbIcon className="w-6 h-6" />}
            tips={[
              "☀️ Morning Screening: Watch your Mind Movie first thing to prime your subconscious",
              "📜 Script Review: Read your Definite Chief Aim aloud with emotion",
              "🚀 Action Execution: Complete your 3 key tasks toward your Chief Aim",
              "🌙 Evening Session: Watch Mind Movie again + complete your Scorecard",
              "📓 Journal Entry: Reflect on wins, lessons, and tomorrow's intentions",
              "🔥 Complete ALL 5 scenes daily to build an unstoppable streak!",
            ]}
          />
        </div>

        {/* Animated Scene Cards */}
        <div className="px-5 pb-8 space-y-3 mt-4">
          {rituals.map((ritual, index) => {
            const isNextStep = index === nextStepIndex;
            return (
            <button
              key={ritual.id}
              onClick={() => handleRitualClick(ritual.id)}
              disabled={isLoading}
              className={cn(
                "w-full relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left group/scene overflow-hidden",
                "border",
                ritual.completed
                  ? "bg-gold/5 border-gold/25 shadow-[0_0_15px_-5px_hsl(37_87%_57%_/_0.2)]"
                  : isNextStep
                  ? "border-gold/40 bg-gold/8 shadow-[0_0_25px_-5px_hsl(37_87%_57%_/_0.35)]"
                  : "bg-secondary/10 border-border/20 hover:border-gold/30 hover:bg-secondary/20 hover:shadow-lg opacity-60",
                isLoading && "opacity-50",
                "hover:translate-y-[-2px] active:scale-[0.98]"
              )}
              style={{
                opacity: isVisible ? (ritual.completed || isNextStep ? 1 : 0.6) : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08 + 0.2}s`,
                ...(isNextStep ? { animation: 'pulse 2.5s ease-in-out infinite' } : {}),
              }}
            >
              {/* UP NEXT badge */}
              {isNextStep && !ritual.completed && (
                <div className="absolute top-2 right-2 z-20">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 animate-pulse">
                    Up Next
                  </span>
                </div>
              )}
              {/* Animated icon orb */}
              <div
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 relative",
                  ritual.completed
                    ? "bg-gradient-to-br from-gold/25 to-gold/10 shadow-[0_0_20px_-5px_hsl(37_87%_57%_/_0.3)]"
                    : "bg-secondary/30 group-hover/scene:bg-secondary/50"
                )}
                style={{
                  borderColor: ritual.completed ? 'hsl(37 87% 57% / 0.3)' : undefined,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                <div className={cn(
                  "transition-all duration-500",
                  ritual.completed
                    ? "text-gold scale-110"
                    : "text-muted-foreground group-hover/scene:text-foreground group-hover/scene:scale-110"
                )}>
                  {ritual.icon}
                </div>
                {/* Breathing glow on completed orbs */}
                {ritual.completed && (
                  <div className="absolute inset-0 rounded-xl animate-pulse opacity-30" style={{
                    background: `radial-gradient(circle, ${ritual.color} 0%, transparent 70%)`,
                  }} />
                )}
              </div>

              {/* Scene number badge */}
              <div className={cn(
                "absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-ui transition-colors",
                ritual.completed
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "bg-secondary/50 text-muted-foreground border border-border/30"
              )}>
                {ritual.sceneNumber}
              </div>

              {/* Title + subtitle */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-ui text-sm sm:text-base tracking-wide transition-colors uppercase font-medium",
                  ritual.completed ? "text-gold" : "text-foreground"
                )}>
                  {ritual.title}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{ritual.subtitle}</p>
              </div>

              {/* Completion indicator */}
              {ritual.completed ? (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shadow-[0_0_10px_-3px_hsl(37_87%_57%_/_0.4)] transition-all duration-500">
                  <Check className="w-4 h-4 text-gold" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 border border-border/20 flex items-center justify-center group-hover/scene:border-gold/30 group-hover/scene:bg-gold/5 transition-all duration-300">
                  <span className="text-muted-foreground text-sm group-hover/scene:text-gold group-hover/scene:translate-x-0.5 transition-all">→</span>
                </div>
              )}

              {/* SHOT ✓ stamp overlay */}
              {ritual.completed && (
                <div className="absolute top-1/2 right-14 -translate-y-1/2 -rotate-12 pointer-events-none opacity-[0.06]">
                  <span className="font-display text-4xl text-gold tracking-widest uppercase">Shot ✓</span>
                </div>
              )}

              {/* Bottom color accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-xl">
                <div
                  className={cn(
                    "h-full transition-all duration-700 ease-out",
                    ritual.completed ? "w-full" : "w-0 group-hover/scene:w-full"
                  )}
                  style={{
                    background: `linear-gradient(90deg, ${ritual.color}, transparent)`,
                    opacity: ritual.completed ? 0.7 : 0.4,
                  }}
                />
              </div>

              {/* Subtle background shimmer on hover */}
              <div className="absolute inset-0 opacity-0 group-hover/scene:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl overflow-hidden">
                <div className="absolute inset-0" style={{
                  background: `radial-gradient(ellipse at 30% 50%, ${ritual.color}08 0%, transparent 60%)`,
                }} />
              </div>
            </button>
            );
          })}
        </div>
        </div> {/* end max-w-lg wrapper */}
      </DialogContent>
    </Dialog>

    {/* Script Review Modal */}
    <ScriptReviewModal
      open={showScriptModal}
      onOpenChange={setShowScriptModal}
      aim={chiefAim || { what: '', byWhen: '', exchange: '', plan: '' }}
      chiefAimSongUrl={chiefAimSongUrl}
      onEdit={onEditChiefAim}
      onAdjust={onAdjustChiefAim}
      onSongListened={onSongListened}
      onRitualComplete={handleScriptRitualComplete}
    />

    {/* Evening Review Modal */}
    <EveningReviewModal
      open={showEveningModal}
      onOpenChange={(open) => {
        setShowEveningModal(open);
        if (!open) {
          toggleRitual("evening");
          onRitualProgressChange?.();
        }
      }}
      onWatchMindMovie={() => {
        if (onEveningMindMovieClick) {
          onEveningMindMovieClick();
        } else {
          onTheaterClick();
        }
      }}
      onOpenScorecard={onScorecardClick}
    />
    </>
  );
};
