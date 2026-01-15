import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Award, Calendar, CheckCircle2, X, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisQuestion {
  id: string;
  question: string;
  type: "text" | "scale" | "yesno";
  category: string;
}

const SELF_ANALYSIS_QUESTIONS: AnalysisQuestion[] = [
  // Goal Achievement
  {
    id: "goal_attained",
    question: "Have I attained the goal which I established as my objective for this year?",
    type: "yesno",
    category: "Goal Achievement"
  },
  // Service Quality
  {
    id: "service_quality",
    question: "Have I delivered service of the best possible quality of which I was capable, or could I have improved any part of this service?",
    type: "text",
    category: "Service Quality"
  },
  {
    id: "service_quantity",
    question: "Have I delivered service in the greatest possible quantity of which I was capable?",
    type: "yesno",
    category: "Service Quality"
  },
  // Conduct & Cooperation
  {
    id: "harmonious_conduct",
    question: "Has the spirit of my conduct been harmonious and cooperative at all times?",
    type: "scale",
    category: "Conduct"
  },
  {
    id: "procrastination",
    question: "Have I permitted the habit of procrastination to decrease my efficiency, and if so, to what extent?",
    type: "text",
    category: "Efficiency"
  },
  // Personal Growth
  {
    id: "personality_improvement",
    question: "Have I improved my personality, and if so, in what ways?",
    type: "text",
    category: "Personal Growth"
  },
  {
    id: "persistence",
    question: "Have I been persistent in following my plans through to completion?",
    type: "scale",
    category: "Persistence"
  },
  {
    id: "decisions",
    question: "Have I reached decisions promptly and definitely on all occasions?",
    type: "scale",
    category: "Decision Making"
  },
  // Basic Fears
  {
    id: "basic_fears",
    question: "Have I permitted any one or more of the six basic fears (poverty, criticism, ill health, loss of love, old age, death) to decrease my efficiency?",
    type: "text",
    category: "Fear Management"
  },
  {
    id: "caution_balance",
    question: "Have I been either 'over-cautious' or 'under-cautious'?",
    type: "text",
    category: "Risk Assessment"
  },
  // Relationships
  {
    id: "work_relationships",
    question: "Has my relationship with my associates in work been pleasant or unpleasant? If unpleasant, has the fault been partly or wholly mine?",
    type: "text",
    category: "Relationships"
  },
  {
    id: "energy_concentration",
    question: "Have I dissipated any of my energy through lack of concentration of effort?",
    type: "yesno",
    category: "Focus"
  },
  // Open-mindedness
  {
    id: "open_minded",
    question: "Have I been open-minded and tolerant in connection with all subjects?",
    type: "scale",
    category: "Open-mindedness"
  },
  {
    id: "service_improvement",
    question: "In what way have I improved my ability to render service?",
    type: "text",
    category: "Service Improvement"
  },
  // Temperance & Ego
  {
    id: "intemperate_habits",
    question: "Have I been intemperate in any of my habits?",
    type: "text",
    category: "Self-Control"
  },
  {
    id: "egotism",
    question: "Have I expressed, either openly or secretly, any form of egotism?",
    type: "yesno",
    category: "Humility"
  },
  // Respect & Integrity
  {
    id: "respect_earned",
    question: "Has my conduct toward my associates been such that it has induced them to respect me?",
    type: "scale",
    category: "Respect"
  },
  {
    id: "accuracy_vs_guesswork",
    question: "Have my opinions and decisions been based upon guesswork, or accuracy of analysis and thought?",
    type: "text",
    category: "Analysis"
  },
  // Time & Budget
  {
    id: "budgeting",
    question: "Have I followed the habit of budgeting my time, my expenses and my income, and have I been conservative in these budgets?",
    type: "scale",
    category: "Time Management"
  },
  {
    id: "unprofitable_time",
    question: "How much time have I devoted to unprofitable effort which I might have used to better advantage?",
    type: "text",
    category: "Time Management"
  },
  {
    id: "rebudget_plan",
    question: "How may I rebudget my time and change my habits so I will be more efficient during the coming year?",
    type: "text",
    category: "Planning"
  },
  // Conscience
  {
    id: "conscience_guilt",
    question: "Have I been guilty of any conduct which was not approved by my conscience?",
    type: "text",
    category: "Integrity"
  },
  {
    id: "extra_service",
    question: "In what ways have I rendered more and better service than I was paid to render?",
    type: "text",
    category: "Service"
  },
  // Fairness
  {
    id: "unfair_conduct",
    question: "Have I been unfair to anyone, and if so, in what way?",
    type: "text",
    category: "Fairness"
  },
  {
    id: "purchase_satisfaction",
    question: "If I had been the purchaser of my own services for the year, would I be satisfied with my purchase?",
    type: "yesno",
    category: "Self-Evaluation"
  },
  // Vocation
  {
    id: "right_vocation",
    question: "Am I in the right vocation, and if not, why not?",
    type: "text",
    category: "Career Alignment"
  },
  {
    id: "client_satisfaction",
    question: "Has the purchaser of my services been satisfied with the service I have rendered, and if not, why not?",
    type: "text",
    category: "Client Relations"
  },
  // Success Rating
  {
    id: "success_rating",
    question: "What is my present rating on the fundamental principles of success? (Rate yourself fairly and frankly.)",
    type: "scale",
    category: "Success Principles"
  }
];

interface AnnualSelfAnalysisProps {
  onClose?: () => void;
  inline?: boolean;
}

export function AnnualSelfAnalysis({ onClose, inline = false }: AnnualSelfAnalysisProps) {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const question = SELF_ANALYSIS_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / SELF_ANALYSIS_QUESTIONS.length) * 100;

  const handleTextResponse = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [question.id]: value
    }));
  };

  const handleScaleResponse = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [question.id]: value
    }));
  };

  const handleYesNoResponse = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [question.id]: value
    }));
    // Auto-advance for yes/no
    if (currentQuestion < SELF_ANALYSIS_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    }
  };

  const goNext = () => {
    if (currentQuestion < SELF_ANALYSIS_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const saveAnalysis = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save to journal as a special year-end reflection entry
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: `Annual Self-Analysis ${new Date().getFullYear()}`,
        content: JSON.stringify(responses, null, 2),
        tags: ["annual-analysis", "self-reflection", "napoleon-hill"],
        mood: "reflective"
      });

      if (error) throw error;

      toast.success("Annual self-analysis saved to your journal!");
      onClose();
    } catch (error) {
      console.error("Error saving analysis:", error);
      toast.error("Failed to save analysis");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    // Create a printable HTML document
    const year = new Date().getFullYear();
    const answeredQuestions = SELF_ANALYSIS_QUESTIONS.filter(q => responses[q.id]);
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Annual Self-Analysis ${year} - Psycho-Cinematics™</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #D4AF37; padding-bottom: 30px; }
    .logo { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #D4AF37; letter-spacing: 2px; }
    h1 { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #D4AF37; margin: 20px 0 10px; }
    .subtitle { color: #888; font-size: 14px; }
    .quote { font-style: italic; color: #888; margin: 20px 0; font-size: 14px; }
    .quote-author { color: #D4AF37; font-size: 12px; }
    .section { margin: 30px 0; page-break-inside: avoid; }
    .category { font-family: 'Bebas Neue', sans-serif; color: #D4AF37; font-size: 16px; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
    .question { font-weight: 500; margin-bottom: 8px; font-size: 14px; }
    .answer { background: #1a1a1a; padding: 15px; border-radius: 8px; border-left: 3px solid #D4AF37; margin-bottom: 20px; }
    .answer-text { color: #ccc; font-size: 13px; line-height: 1.6; }
    .answer-scale { display: inline-block; background: #D4AF37; color: #000; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
    .answer-yesno { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
    .answer-yes { background: #22c55e; color: #000; }
    .answer-no { background: #ef4444; color: #fff; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #333; padding-top: 20px; }
    @media print { body { background: #fff; color: #000; } .answer { background: #f5f5f5; border-left-color: #000; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PSYCHO-CINEMATICS™ DIRECTOR'S OS</div>
    <h1>Annual Self-Analysis ${year}</h1>
    <div class="subtitle">Personal Inventory Assessment based on Napoleon Hill</div>
    <div class="quote">"Annual self-analysis will disclose whether advancement has been made, and if so, how much."</div>
    <div class="quote-author">— Napoleon Hill, Think and Grow Rich</div>
  </div>
  
  ${answeredQuestions.map(q => `
    <div class="section">
      <div class="category">${q.category}</div>
      <div class="question">${q.question}</div>
      <div class="answer">
        ${q.type === 'text' 
          ? `<div class="answer-text">${responses[q.id] || 'Not answered'}</div>`
          : q.type === 'scale'
          ? `<span class="answer-scale">${responses[q.id]}/10</span>`
          : `<span class="answer-yesno ${responses[q.id] === 'yes' ? 'answer-yes' : 'answer-no'}">${responses[q.id]?.toUpperCase()}</span>`
        }
      </div>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()} • Psycho-Cinematics™ Director's OS</p>
    <p style="margin-top: 10px; color: #D4AF37;">"One goes ahead, stands still or goes backward in life. One's object should be, of course, to go ahead."</p>
  </div>
</body>
</html>`;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    toast.success("PDF ready - use Print > Save as PDF");
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl glass-card cinematic-border">
            <CardHeader className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/30 to-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-gold" />
              </div>
              <CardTitle className="text-2xl font-display tracking-wide text-gold-gradient">
                Self-Analysis Complete
              </CardTitle>
              <p className="text-muted-foreground max-w-md mx-auto">
                "Annual self-analysis will disclose whether advancement has been made, and if so, how much."
                <span className="block mt-2 text-gold/70 text-sm">— Napoleon Hill</span>
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm text-gold">Summary</h4>
                <p className="text-sm text-muted-foreground">
                  You've completed {Object.keys(responses).length} of {SELF_ANALYSIS_QUESTIONS.length} questions.
                  This reflection will be saved to your Director's Journal for future reference.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={generatePDF}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Review Later
                </Button>
                <Button 
                  onClick={saveAnalysis} 
                  disabled={isSaving}
                  className="gap-2 bg-gold hover:bg-gold/90 text-background"
                >
                  {isSaving ? "Saving..." : "Save to Journal"}
                  <Award className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl glass-card cinematic-border">
          <CardHeader className="text-center space-y-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-gold" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display tracking-wide text-gold-gradient">
                Annual Self-Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Year-End Reflection by Napoleon Hill
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Question {currentQuestion + 1} of {SELF_ANALYSIS_QUESTIONS.length}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Category Tag */}
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium">
                {question.category}
              </span>
            </div>

            {/* Question */}
            <h3 className="text-lg font-medium text-center leading-relaxed">
              {question.question}
            </h3>

            {/* Response Area */}
            <div className="space-y-4">
              {question.type === "text" && (
                <Textarea
                  value={responses[question.id] || ""}
                  onChange={(e) => handleTextResponse(e.target.value)}
                  placeholder="Take your time to reflect honestly..."
                  className="min-h-[120px] resize-none"
                />
              )}

              {question.type === "scale" && (
                <div className="space-y-4">
                  <RadioGroup
                    value={responses[question.id] || ""}
                    onValueChange={handleScaleResponse}
                    className="flex justify-center gap-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <div key={num} className="flex flex-col items-center">
                        <RadioGroupItem
                          value={num.toString()}
                          id={`scale-${num}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`scale-${num}`}
                          className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                            responses[question.id] === num.toString()
                              ? "bg-gold text-background border-gold"
                              : "border-border hover:border-gold/50 hover:bg-gold/10"
                          }`}
                        >
                          {num}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Needs Work</span>
                    <span>Excellent</span>
                  </div>
                </div>
              )}

              {question.type === "yesno" && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant={responses[question.id] === "yes" ? "default" : "outline"}
                    onClick={() => handleYesNoResponse("yes")}
                    className={`w-24 ${responses[question.id] === "yes" ? "bg-green-600 hover:bg-green-700" : ""}`}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={responses[question.id] === "no" ? "default" : "outline"}
                    onClick={() => handleYesNoResponse("no")}
                    className={`w-24 ${responses[question.id] === "no" ? "bg-red-600 hover:bg-red-700" : ""}`}
                  >
                    No
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={currentQuestion === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={goNext}
                className="gap-2"
                disabled={question.type === "text" && !responses[question.id]?.trim()}
              >
                {currentQuestion === SELF_ANALYSIS_QUESTIONS.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}