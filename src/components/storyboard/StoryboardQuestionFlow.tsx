import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Star, Zap, Heart, Mountain, Crown, Wand2, Loader2, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoryboardQuestionFlowProps {
  chiefAim?: {
    what: string;
    byWhen: string;
    exchange: string;
    plan: string;
  };
  onAnswersChange: (answers: Record<string, string>) => void;
  characterDescription?: string;
  referencePhotoUrl?: string | null;
}

const QUESTIONS = [
  {
    id: "setting",
    icon: Mountain,
    question: "Where does your success story take place?",
    placeholder: "Describe the locations: your dream home, office, city, beach house, car, etc.",
    helperText: "These become the backdrops for your movie scenes.",
    aiPrompt: "Generate vivid, specific location descriptions for a success visualization movie",
  },
  {
    id: "appearance",
    icon: Crown,
    question: "How does your future self look and carry themselves?",
    placeholder: "Your posture, confidence, style, expressions... How do you show up in the world?",
    helperText: "This defines how you appear in every scene.",
    aiPrompt: "Describe how the successful, transformed version of this person looks and carries themselves",
  },
  {
    id: "moments",
    icon: Star,
    question: "What are the key moments of your success?",
    placeholder: "Signing the deal, receiving the award, seeing the bank balance, the celebration...",
    helperText: "These become the highlight scenes of your movie.",
    aiPrompt: "Generate powerful, cinematic key moments of achievement and success",
  },
  {
    id: "emotions",
    icon: Heart,
    question: "What emotions do you want to FEEL watching this?",
    placeholder: "Powerful, unstoppable, grateful, free, wealthy, loved, confident, excited...",
    helperText: "The AI will craft scenes to evoke these feelings.",
    aiPrompt: "List powerful, transformative emotions that align with achieving this goal",
  },
  {
    id: "symbols",
    icon: Zap,
    question: "What symbols of success should appear?",
    placeholder: "Luxury car, beach house, first-class travel, loving family, fit body, big team...",
    helperText: "Visual proof of your achieved goals.",
    aiPrompt: "Generate specific, vivid symbols of success and achievement",
  },
];

export function StoryboardQuestionFlow({ chiefAim, onAnswersChange, characterDescription, referencePhotoUrl }: StoryboardQuestionFlowProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>("setting");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [improvingId, setImprovingId] = useState<string | null>(null);

  useEffect(() => {
    onAnswersChange(answers);
  }, [answers, onAnswersChange]);

  const updateAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleAIGenerate = async (questionId: string) => {
    const question = QUESTIONS.find(q => q.id === questionId);
    if (!question) return;

    setGeneratingId(questionId);
    try {
      const context = `
Chief Aim: ${chiefAim?.what || "To achieve their highest potential"}
By When: ${chiefAim?.byWhen || "Within the next year"}
Character: ${characterDescription || "A confident, successful individual"}
      `.trim();

      const { data, error } = await supabase.functions.invoke('storyboard-ai', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are helping create a powerful Mind Movie visualization. Generate vivid, specific, cinematic descriptions. Be concise but evocative. No bullet points - write flowing prose. Keep it under 100 words.`
            },
            {
              role: 'user',
              content: `${question.aiPrompt} based on this context:\n${context}\n\nQuestion: ${question.question}`
            }
          ]
        }
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        updateAnswer(questionId, content.trim());
        toast.success("AI suggestion generated!");
      } else {
        throw new Error("No content returned");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate suggestion. Please try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleAIImprove = async (questionId: string) => {
    const currentAnswer = answers[questionId];
    if (!currentAnswer?.trim()) {
      toast.error("Write something first, then I'll improve it!");
      return;
    }

    setImprovingId(questionId);
    try {
      const { data, error } = await supabase.functions.invoke('storyboard-ai', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a cinematic writing coach. Take the user's description and make it more vivid, specific, and emotionally powerful for a Mind Movie visualization. Keep the same meaning but enhance the imagery. Be concise - under 100 words.`
            },
            {
              role: 'user',
              content: `Improve this for a Mind Movie:\n\n"${currentAnswer}"\n\nMake it more cinematic and emotionally powerful.`
            }
          ]
        }
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        updateAnswer(questionId, content.trim());
        toast.success("Your description has been enhanced!");
      } else {
        throw new Error("No content returned");
      }
    } catch (error) {
      console.error("AI improve error:", error);
      toast.error("Failed to improve. Please try again.");
    } finally {
      setImprovingId(null);
    }
  };

  const handleAutoFillAll = async () => {
    if (!chiefAim?.what) {
      toast.error("Complete your Definite Chief Aim first for best results!");
      return;
    }

    setGeneratingId("all");
    try {
      const context = `
Chief Aim: ${chiefAim?.what}
By When: ${chiefAim?.byWhen}
Exchange: ${chiefAim?.exchange}
Plan: ${chiefAim?.plan}
Character: ${characterDescription || "The ideal, transformed self"}
      `.trim();

      const { data, error } = await supabase.functions.invoke('storyboard-ai', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are creating a Mind Movie visualization blueprint. Generate vivid, cinematic answers for ALL 5 questions. Return ONLY a JSON object with keys: setting, appearance, moments, emotions, symbols. Each value should be 50-80 words of evocative prose. No bullet points. Return ONLY valid JSON, no markdown.`
            },
            {
              role: 'user',
              content: `Create a complete Mind Movie visualization for:\n${context}\n\nReturn JSON with: setting, appearance, moments, emotions, symbols`
            }
          ],
          returnJson: true
        }
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        // Try to parse as JSON
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const newAnswers: Record<string, string> = {};
            QUESTIONS.forEach(q => {
              if (parsed[q.id]) {
                newAnswers[q.id] = parsed[q.id].trim();
              }
            });
            setAnswers(prev => ({ ...prev, ...newAnswers }));
            toast.success("All questions auto-filled by AI!");
          } else {
            throw new Error("No JSON found");
          }
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr, content);
          toast.error("AI returned unexpected format. Try individual questions.");
        }
      } else {
        throw new Error("No content returned");
      }
    } catch (error) {
      console.error("AI auto-fill error:", error);
      toast.error("Failed to auto-fill. Please try individual questions.");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Character Reference Photo Indicator */}
      {referencePhotoUrl && (
        <div className="glass-card p-3 border-l-4 border-cyan-500 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-cyan-500/50 flex-shrink-0">
            <img 
              src={referencePhotoUrl} 
              alt="Your character" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5">
              <Check className="w-2 h-2 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-medium text-cyan-400">Your Character Loaded</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              This photo will appear in all generated scenes
            </p>
          </div>
        </div>
      )}

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

      {/* Auto-fill all button */}
      <Button
        onClick={handleAutoFillAll}
        disabled={generatingId === "all"}
        className="w-full bg-gradient-to-r from-gold/20 to-amber-600/20 hover:from-gold/30 hover:to-amber-600/30 border border-gold/30 text-gold"
        variant="outline"
      >
        {generatingId === "all" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            AI is creating your vision...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Auto-Fill All with AI
          </>
        )}
      </Button>

      {/* Questions */}
      <div className="space-y-3">
        {QUESTIONS.map((q) => {
          const Icon = q.icon;
          const isExpanded = expandedQuestion === q.id;
          const hasAnswer = !!answers[q.id]?.trim();
          const isGenerating = generatingId === q.id;
          const isImproving = improvingId === q.id;

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
                <div className="px-4 pb-4 space-y-3 animate-fade-in">
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="min-h-[100px] text-sm"
                  />
                  
                  {/* AI Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAIGenerate(q.id)}
                      disabled={isGenerating || isImproving}
                      className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3 mr-1" />
                      )}
                      Generate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAIImprove(q.id)}
                      disabled={isGenerating || isImproving || !hasAnswer}
                      className="flex-1 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    >
                      {isImproving ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      Improve
                    </Button>
                  </div>

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
