import { useState } from "react";
import { Check, Play, FileText, Target, ClipboardCheck, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RitualItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface DailyRitualChecklistProps {
  onTheaterClick: () => void;
  onScorecardClick: () => void;
  onEditBayClick?: () => void;
}

export const DailyRitualChecklist = ({ onTheaterClick, onScorecardClick, onEditBayClick }: DailyRitualChecklistProps) => {
  const [rituals, setRituals] = useState<RitualItem[]>([
    {
      id: "morning",
      title: "Morning Screening",
      subtitle: "Watch your Mind Movie",
      icon: <Play className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "script",
      title: "Script Review",
      subtitle: "Read your Definite Chief Aim",
      icon: <FileText className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "create",
      title: "The Edit Bay",
      subtitle: "Create AI media",
      icon: <Wand2 className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "actions",
      title: "Action Execution",
      subtitle: "Complete 3 key tasks",
      icon: <Target className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "evening",
      title: "Evening Review",
      subtitle: "Complete your Scorecard",
      icon: <ClipboardCheck className="w-5 h-5" />,
      completed: false,
    },
  ]);

  const toggleRitual = (id: string) => {
    setRituals(prev =>
      prev.map(ritual =>
        ritual.id === id ? { ...ritual, completed: !ritual.completed } : ritual
      )
    );
  };

  const completedCount = rituals.filter(r => r.completed).length;
  const progress = (completedCount / rituals.length) * 100;

  const handleRitualClick = (id: string) => {
    if (id === "morning") {
      onTheaterClick();
    } else if (id === "evening") {
      onScorecardClick();
    } else if (id === "create") {
      onEditBayClick?.();
    }
    toggleRitual(id);
  };

  return (
    <div className="glass-card p-6 cinematic-border animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-gold" />
          <h3 className="text-xl font-display tracking-wide">Daily Ritual</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{rituals.length} Complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {rituals.map((ritual, index) => (
          <button
            key={ritual.id}
            onClick={() => handleRitualClick(ritual.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-300 group text-left",
              ritual.completed
                ? "bg-gold/10 border border-gold/30"
                : "bg-secondary/50 border border-transparent hover:border-border hover:bg-secondary"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                ritual.completed
                  ? "bg-gold text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:text-foreground"
              )}
            >
              {ritual.completed ? <Check className="w-5 h-5" /> : ritual.icon}
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-medium transition-colors",
                ritual.completed && "text-gold"
              )}>
                {ritual.title}
              </p>
              <p className="text-sm text-muted-foreground">{ritual.subtitle}</p>
            </div>
            {ritual.completed && (
              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-gold" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
