import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles, Star, Zap, Heart, Mountain, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryboardQuestionFlowProps {
  chiefAim?: {
    what: string;
    byWhen: string;
    exchange: string;
    plan: string;
  };
  onAnswersChange: (answers: Record<string, string>) => void;
}

const QUESTIONS = [
  {
    id: "setting",
    icon: Mountain,
    question: "Where does your success story take place?",
    placeholder: "Describe the locations: your dream home, office, city, beach house, car, etc.",
    helperText: "These become the backdrops for your movie scenes.",
  },
  {
    id: "appearance",
    icon: Crown,
    question: "How does your future self look and carry themselves?",
    placeholder: "Your posture, confidence, style, expressions... How do you show up in the world?",
    helperText: "This defines how you appear in every scene.",
  },
  {
    id: "moments",
    icon: Star,
    question: "What are the key moments of your success?",
    placeholder: "Signing the deal, receiving the award, seeing the bank balance, the celebration...",
    helperText: "These become the highlight scenes of your movie.",
  },
  {
    id: "emotions",
    icon: Heart,
    question: "What emotions do you want to FEEL watching this?",
    placeholder: "Powerful, unstoppable, grateful, free, wealthy, loved, confident, excited...",
    helperText: "The AI will craft scenes to evoke these feelings.",
  },
  {
    id: "symbols",
    icon: Zap,
    question: "What symbols of success should appear?",
    placeholder: "Luxury car, beach house, first-class travel, loving family, fit body, big team...",
    helperText: "Visual proof of your achieved goals.",
  },
];

export function StoryboardQuestionFlow({ chiefAim, onAnswersChange }: StoryboardQuestionFlowProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>("setting");

  useEffect(() => {
    onAnswersChange(answers);
  }, [answers, onAnswersChange]);

  const updateAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Chief Aim Preview */}
      {chiefAim?.what && (
        <div className="glass-card p-4 border-l-4 border-gold">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold">Your Definite Chief Aim</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{chiefAim.what}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">By: {chiefAim.byWhen}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {QUESTIONS.map((q) => {
          const Icon = q.icon;
          const isExpanded = expandedQuestion === q.id;
          const hasAnswer = !!answers[q.id]?.trim();

          return (
            <div
              key={q.id}
              className={cn(
                "glass-card overflow-hidden transition-all duration-300",
                isExpanded ? "ring-1 ring-gold/50" : "hover:bg-muted/30"
              )}
            >
              <button
                onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  hasAnswer ? "bg-green-500/20 text-green-500" : "bg-gold/20 text-gold"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{q.question}</p>
                  {hasAnswer && !isExpanded && (
                    <p className="text-xs text-muted-foreground truncate mt-1">{answers[q.id]}</p>
                  )}
                </div>
                {hasAnswer && (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-green-500" />
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2 animate-fade-in">
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="min-h-[100px] text-sm"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {q.helperText}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
