import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, X, Scale, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FIFTEEN_LAWS,
  SIX_BASIC_FEARS,
  MAAT_PRINCIPLES,
  FREQUENCY_OPTIONS,
  scorePersonalAnalysis,
  type Answers,
  type BehaviorStatement,
  type Frequency,
  type PersonalAnalysisResult,
  type SelfGrades,
} from "@/lib/lawOfSuccess/personalAnalysis";

interface LawOfSuccessAnalysisProps {
  onClose: () => void;
  onComplete: (result: PersonalAnalysisResult) => void;
}

type Step =
  | { kind: "intro" }
  | { kind: "law"; index: number }
  | { kind: "fears" }
  | { kind: "maat" };

const STEPS: Step[] = [
  { kind: "intro" },
  ...FIFTEEN_LAWS.map((_, index) => ({ kind: "law" as const, index })),
  { kind: "fears" },
  { kind: "maat" },
];

function StatementRow({
  statement,
  value,
  onChange,
}: {
  statement: BehaviorStatement;
  value: Frequency | undefined;
  onChange: (v: Frequency) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed">{statement.text}</p>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={statement.text}>
        {FREQUENCY_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`rounded-md border px-0.5 py-2 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                selected
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:border-gold/40 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LawOfSuccessAnalysis({ onClose, onComplete }: LawOfSuccessAnalysisProps) {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [selfGrades, setSelfGrades] = useState<SelfGrades>({});
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const progress = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  const setAnswer = (id: string, v: Frequency) => setAnswers((prev) => ({ ...prev, [id]: v }));

  const stepStatements: BehaviorStatement[] = useMemo(() => {
    if (step.kind === "law") return FIFTEEN_LAWS[step.index].statements;
    if (step.kind === "fears") return SIX_BASIC_FEARS.flatMap((f) => f.statements);
    if (step.kind === "maat") return MAAT_PRINCIPLES.map((m) => m.statement);
    return [];
  }, [step]);

  const stepComplete = stepStatements.every((s) => answers[s.id] !== undefined);
  const isLast = stepIndex === STEPS.length - 1;

  const finish = async () => {
    const result = scorePersonalAnalysis(answers, selfGrades);
    if (!user) {
      toast.error("Sign in to save your analysis.");
      onComplete(result);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("law_of_success_analyses").insert({
      user_id: user.id,
      answers,
      self_grades: selfGrades,
      law_scores: Object.fromEntries(result.laws.map((l) => [l.key, l.grade])),
      fear_scores: Object.fromEntries(result.fears.map((f) => [f.key, f.intensity])),
      maat_scores: Object.fromEntries(result.maat.map((m) => [m.key, m.alignment])),
      general_average: result.generalAverage,
      chief_aim_grade: result.chiefAimGrade,
      maat_alignment: result.maatAlignment,
      danger_points: result.dangerPoints,
      blind_spots: result.blindSpots,
      dominant_fear: result.dominantFear,
    });
    setSaving(false);
    if (error) {
      console.error("Failed to save Law of Success analysis", error);
      toast.error("Your results are shown, but they couldn't be saved. Try again later.");
    } else {
      toast.success("Personal Analysis saved.");
    }
    onComplete(result);
  };

  const next = () => {
    if (isLast) {
      void finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="relative w-full max-w-2xl glass-card cinematic-border">
          <CardHeader className="text-center space-y-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4" aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center mx-auto">
              <Scale className="w-7 h-7 text-gold" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display tracking-wide text-gold-gradient">
                Law of Success Personal Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Napoleon Hill's Fifteen Laws · Six Basic Fears · Maat</p>
            </div>
            {step.kind !== "intro" && (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Step {stepIndex} of {STEPS.length - 1}
                </p>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {step.kind === "intro" && (
              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  In <em>The Law of Success</em> (1928), Napoleon Hill asks every student to grade themselves from 0 to
                  100% on the Fifteen Laws of Success before the course, then again after it.
                </p>
                <blockquote className="border-l-2 border-gold/60 pl-4 italic text-muted-foreground">
                  "Notice that all the successful men grade 100% on a Definite Chief Aim… A grading of zero on any one of
                  the Fifteen Laws of Success is sufficient to cause failure, even though all other grades are high."
                </blockquote>
                <p>
                  For each law you'll answer three questions about what you actually <strong>do</strong>, then give
                  yourself a grade the way Hill did. The gap between the two shows your blind spots. You'll finish with
                  Hill's six basic fears and a short Maat check.
                </p>
                <p className="text-muted-foreground">About 10 minutes. Your first run becomes your "before" score.</p>
              </div>
            )}

            {step.kind === "law" && (() => {
              const law = FIFTEEN_LAWS[step.index];
              const grade = selfGrades[law.key] ?? 50;
              return (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Law {law.chartNumeral}
                    </span>
                    <h3 className="text-xl font-display">{law.name}</h3>
                    <p className="text-sm text-muted-foreground">{law.teaching}</p>
                    {law.hillQuote && (
                      <p className="text-xs italic text-gold/80">"{law.hillQuote}" — Napoleon Hill</p>
                    )}
                  </div>
                  <div className="space-y-5">
                    {law.statements.map((s) => (
                      <StatementRow key={s.id} statement={s} value={answers[s.id]} onChange={(v) => setAnswer(s.id, v)} />
                    ))}
                  </div>
                  <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Hill's way: grade yourself on {law.name}</p>
                      <span className="text-lg font-display text-gold">{grade}%</span>
                    </div>
                    <Slider
                      value={[grade]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={([v]) => setSelfGrades((prev) => ({ ...prev, [law.key]: v }))}
                      aria-label={`Self-grade for ${law.name}`}
                    />
                  </div>
                </div>
              );
            })()}

            {step.kind === "fears" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-display">Your Six Most Dangerous Enemies</h3>
                  <p className="text-sm text-muted-foreground">
                    Hill: "Your fears must be mastered before you can win in any worthwhile undertaking in life." How
                    often is each of these true for you?
                  </p>
                </div>
                {SIX_BASIC_FEARS.map((fear) => (
                  <div key={fear.key} className="space-y-4 rounded-lg border border-border/50 p-4">
                    <p className="text-sm font-semibold text-red-300/90">{fear.name}</p>
                    {fear.statements.map((s) => (
                      <StatementRow key={s.id} statement={s} value={answers[s.id]} onChange={(v) => setAnswer(s.id, v)} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {step.kind === "maat" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-display">Maat Alignment</h3>
                  <p className="text-sm text-muted-foreground">
                    Hill defines success as reaching your aim "without violating the rights of other people." Maat is how
                    the Metu Neter measures that.
                  </p>
                </div>
                {MAAT_PRINCIPLES.map((p) => (
                  <div key={p.key} className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gold/80">{p.name}</p>
                    <StatementRow statement={p.statement} value={answers[p.statement.id]} onChange={(v) => setAnswer(p.statement.id, v)} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                disabled={stepIndex === 0 || saving}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="gold" onClick={next} disabled={!stepComplete || saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step.kind === "intro" ? (
                  "Begin"
                ) : isLast ? (
                  "See my chart"
                ) : (
                  <>
                    Next <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
