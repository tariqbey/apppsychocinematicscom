import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Play, FileText, Target, ClipboardCheck, Sparkles, LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { TutorialTipCard } from "@/components/community/TutorialTipCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface RitualItem {
  id: string;
  dbField: 'morning_screening' | 'script_review' | 'action_execution' | 'evening_review';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface DailyRitualChecklistProps {
  onTheaterClick: () => void;
  onScorecardClick: () => void;
  onEveningMindMovieClick?: () => void;
}

export const DailyRitualChecklist = ({ onTheaterClick, onScorecardClick, onEveningMindMovieClick }: DailyRitualChecklistProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rituals, setRituals] = useState<RitualItem[]>([
    {
      id: "morning",
      dbField: "morning_screening",
      title: "Morning Screening",
      subtitle: "Watch your Mind Movie",
      icon: <Play className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "script",
      dbField: "script_review",
      title: "Script Review",
      subtitle: "Read your Definite Chief Aim",
      icon: <FileText className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "actions",
      dbField: "action_execution",
      title: "Action Execution",
      subtitle: "Complete 3 key tasks",
      icon: <Target className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "evening",
      dbField: "evening_review",
      title: "Evening Session",
      subtitle: "Watch Mind Movie + Complete Scorecard",
      icon: <ClipboardCheck className="w-5 h-5" />,
      completed: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEveningFlow, setShowEveningFlow] = useState(false);

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
    }
    toggleRitual(id);
  };

  return (
    <div className="glass-card p-4 sm:p-6 cinematic-border animate-slide-up space-y-4" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
          <h3 className="text-lg sm:text-xl font-display tracking-wide">Daily Ritual</h3>
          <InfoTooltip content="Your daily ritual is the foundation of transformation. Morning: Watch Mind Movie + Read Chief Aim. Midday: Complete 3 key tasks. Evening: Score yourself honestly on the scorecard." />
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {completedCount}/{rituals.length}
        </span>
      </div>

      {/* Tutorial Tip */}
      <TutorialTipCard
        id="daily-ritual-tips"
        title="Master Your Daily Ritual"
        variant="gold"
        icon={<LightbulbIcon className="w-5 h-5" />}
        tips={[
          "Morning: Watch your Mind Movie first thing to prime your subconscious",
          "Midday: Execute your 3 key tasks that move you toward your Chief Aim",
          "Evening: Watch your Mind Movie AGAIN before bed, then complete your scorecard",
        ]}
      />

      {/* Progress bar */}
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2 sm:space-y-3">
        {rituals.map((ritual, index) => (
          <button
            key={ritual.id}
            onClick={() => handleRitualClick(ritual.id)}
            disabled={isLoading}
            className={cn(
              "w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all duration-300 group text-left",
              ritual.completed
                ? "bg-gold/10 border border-gold/30"
                : "bg-secondary/50 border border-transparent hover:border-border hover:bg-secondary",
              isLoading && "opacity-50"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0",
                ritual.completed
                  ? "bg-gold text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:text-foreground"
              )}
            >
              {ritual.completed ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : ritual.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm sm:text-base transition-colors truncate",
                ritual.completed && "text-gold"
              )}>
                {ritual.title}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{ritual.subtitle}</p>
            </div>
            {ritual.completed && (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
