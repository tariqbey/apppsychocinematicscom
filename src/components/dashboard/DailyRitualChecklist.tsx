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
    }
  };

  const completedCount = rituals.filter(r => r.completed).length;
  const progress = (completedCount / rituals.length) * 100;

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
      navigate("/actions");
    } else if (id === "journal") {
      if (onJournalClick) {
        onJournalClick();
      }
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
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Film className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl tracking-wide">Daily Ritual</h3>
              <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {completedCount} of {rituals.length} scenes complete
              </p>
            </div>
            <span className="ml-auto font-ui text-xs text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
              {completedCount}/{rituals.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold/80 transition-all duration-500 rounded-full"
              style={{ 
                width: `${progress}%`,
                boxShadow: progress > 0 ? '0 0 10px hsl(37 87% 57% / 0.5)' : undefined,
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

        {/* Scene Cards */}
        <div className="px-5 pb-5 space-y-2 mt-2">
          {rituals.map((ritual, index) => (
            <button
              key={ritual.id}
              onClick={() => handleRitualClick(ritual.id)}
              disabled={isLoading}
              className={cn(
                "w-full relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all duration-300 text-left group/scene",
                "border",
                ritual.completed
                  ? "bg-gold/5 border-gold/20"
                  : "bg-secondary/20 border-border/20 hover:border-gold/20 hover:bg-secondary/30",
                isLoading && "opacity-50",
                "hover:translate-y-[-1px] active:scale-[0.99]"
              )}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                transition: `all 0.3s ease ${index * 0.06}s`,
              }}
            >
              {/* Scene number */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center font-ui text-xs sm:text-sm font-bold border transition-colors",
                ritual.completed
                  ? "bg-gold/15 border-gold/30 text-gold"
                  : "bg-secondary/40 border-border/30 text-muted-foreground"
              )}>
                {ritual.sceneNumber}
              </div>

              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 transition-colors",
                ritual.completed ? "text-gold" : "text-muted-foreground group-hover/scene:text-foreground"
              )}>
                {ritual.icon}
              </div>

              {/* Title + subtitle */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-ui text-sm sm:text-base tracking-wide transition-colors uppercase",
                  ritual.completed ? "text-gold" : "text-foreground"
                )}>
                  {ritual.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{ritual.subtitle}</p>
              </div>

              {/* Completion check or arrow */}
              {ritual.completed ? (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-gold" />
                </div>
              ) : (
                <span className="flex-shrink-0 text-muted-foreground text-sm group-hover/scene:text-gold group-hover/scene:translate-x-0.5 transition-all">→</span>
              )}

              {/* SHOT ✓ stamp overlay */}
              {ritual.completed && (
                <div className="absolute top-1/2 right-12 sm:right-16 -translate-y-1/2 -rotate-12 pointer-events-none opacity-[0.08]">
                  <span className="font-display text-3xl sm:text-4xl text-gold tracking-widest uppercase">Shot ✓</span>
                </div>
              )}

              {/* Bottom amber progress line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-lg">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    ritual.completed ? "w-full" : "w-0 group-hover/scene:w-full"
                  )}
                  style={{
                    background: ritual.color,
                    opacity: ritual.completed ? 0.6 : 0.3,
                  }}
                />
              </div>
            </button>
          ))}
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
