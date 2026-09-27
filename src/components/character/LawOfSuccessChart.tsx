import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Loader2, Scale, ShieldAlert, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DANGER_THRESHOLD,
  FEAR_THRESHOLD,
  FIFTEEN_LAWS,
  MAAT_PRINCIPLES,
  SIX_BASIC_FEARS,
  fearByKey,
  lawByKey,
} from "@/lib/lawOfSuccess/personalAnalysis";

interface StoredAnalysis {
  id: string;
  created_at: string;
  is_baseline: boolean;
  law_scores: Record<string, number>;
  self_grades: Record<string, number>;
  fear_scores: Record<string, number>;
  maat_scores: Record<string, number>;
  general_average: number;
  chief_aim_grade: number;
  maat_alignment: number;
  danger_points: string[];
  blind_spots: string[];
  dominant_fear: string | null;
}

interface LawOfSuccessChartProps {
  /** Increment to force a reload after a new analysis is saved. */
  refreshKey?: number;
  onStart: () => void;
}

function barColor(grade: number) {
  if (grade <= DANGER_THRESHOLD) return "bg-red-500";
  if (grade < 60) return "bg-amber-500";
  return "bg-emerald-500";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function LawOfSuccessChart({ refreshKey = 0, onStart }: LawOfSuccessChartProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [baseline, setBaseline] = useState<StoredAnalysis | null>(null);
  const [latest, setLatest] = useState<StoredAnalysis | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: latestRows }, { data: baseRows }] = await Promise.all([
      supabase
        .from("law_of_success_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("law_of_success_analyses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_baseline", true)
        .limit(1),
    ]);
    setLatest((latestRows?.[0] as unknown as StoredAnalysis) ?? null);
    setBaseline((baseRows?.[0] as unknown as StoredAnalysis) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
            <Scale className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-display text-gold">Law of Success Personal Analysis</h2>
            <p className="text-sm text-muted-foreground">Napoleon Hill's 15-law chart, the six fears and Maat</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Grade yourself on Hill's Fifteen Laws of Success the way the 1928 course teaches, backed by questions about
          what you actually do. Your first run is your "before" score; retake it at the end of each cycle to see the
          "after."
        </p>
        <Button variant="gold" onClick={onStart} className="w-full gap-2">
          <Scale className="h-4 w-4" />
          Take the Personal Analysis
        </Button>
      </div>
    );
  }

  const hasComparison = baseline && baseline.id !== latest.id;
  const dominantFear = latest.dominant_fear ? fearByKey(latest.dominant_fear) : null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display text-gold">{latest.general_average}%</p>
            <p className="text-xs text-muted-foreground">General average</p>
            {hasComparison && (
              <p className="text-[11px] text-muted-foreground mt-1">
                was {baseline.general_average}% ({latest.general_average - baseline.general_average >= 0 ? "+" : ""}
                {latest.general_average - baseline.general_average})
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-display ${latest.chief_aim_grade >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
              {latest.chief_aim_grade}%
            </p>
            <p className="text-xs text-muted-foreground">Definite Chief Aim</p>
            <p className="text-[11px] text-muted-foreground mt-1">Hill's bar: 100%</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-display ${latest.danger_points.length ? "text-red-400" : "text-emerald-400"}`}>
              {latest.danger_points.length}
            </p>
            <p className="text-xs text-muted-foreground">Danger points</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display text-purple-300">{latest.maat_alignment}%</p>
            <p className="text-xs text-muted-foreground">Maat alignment</p>
          </CardContent>
        </Card>
      </div>

      {/* The chart */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gold" /> Your Personal Analysis Chart
            </span>
            <span className="text-xs font-normal text-muted-foreground">{formatDate(latest.created_at)}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {hasComparison
              ? `Faint bar = before (${formatDate(baseline.created_at)}). Solid bar = now. Tick = the grade you gave yourself.`
              : "Solid bar = your behavior-based grade. Tick = the grade you gave yourself."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {FIFTEEN_LAWS.map((law) => {
            const grade = latest.law_scores[law.key] ?? 0;
            const before = hasComparison ? baseline.law_scores[law.key] : undefined;
            const self = latest.self_grades[law.key];
            const isDanger = latest.danger_points.includes(law.key);
            const isBlind = latest.blind_spots.includes(law.key);
            return (
              <div key={law.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground w-8">{law.chartNumeral}.</span>
                    <span className={isDanger ? "text-red-300 font-medium" : ""}>{law.name}</span>
                    {isDanger && <AlertTriangle className="h-3 w-3 text-red-400" aria-label="Danger point" />}
                    {isBlind && <Eye className="h-3 w-3 text-amber-300" aria-label="Blind spot" />}
                  </span>
                  <span className="tabular-nums font-medium">
                    {grade}%
                    {before !== undefined && (
                      <span className={`ml-1 ${grade - before >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        ({grade - before >= 0 ? "+" : ""}
                        {grade - before})
                      </span>
                    )}
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-muted/40 overflow-hidden">
                  {before !== undefined && (
                    <div className="absolute inset-y-0 left-0 bg-foreground/15" style={{ width: `${before}%` }} />
                  )}
                  <div className={`absolute inset-y-0 left-0 ${barColor(grade)}`} style={{ width: `${grade}%` }} />
                  {typeof self === "number" && (
                    <div className="absolute inset-y-0 w-0.5 bg-gold" style={{ left: `calc(${self}% - 1px)` }} />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Danger points & blind spots */}
      {(latest.danger_points.length > 0 || latest.blind_spots.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {latest.danger_points.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-red-300">
                  <AlertTriangle className="h-4 w-4" /> Danger points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  Hill: a zero on any one law "is sufficient to cause failure, even though all other grades are high."
                  Work these first.
                </p>
                {latest.danger_points.map((k) => (
                  <p key={k}>
                    <span className="font-medium">{lawByKey(k)?.name}</span>{" "}
                    <span className="text-muted-foreground">— {lawByKey(k)?.teaching}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
          {latest.blind_spots.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-300">
                  <Eye className="h-4 w-4" /> Blind spots
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  You graded yourself well above what your answers show. Hill: "taking care to see that you really know
                  what are your weaknesses."
                </p>
                {latest.blind_spots.map((k) => (
                  <p key={k}>
                    <span className="font-medium">{lawByKey(k)?.name}</span>{" "}
                    <span className="text-muted-foreground">
                      — you said {latest.self_grades[k]}%, behavior shows {latest.law_scores[k]}%
                    </span>
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Fears & Maat */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-red-300" /> The six basic fears
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SIX_BASIC_FEARS.map((f) => {
              const v = latest.fear_scores[f.key] ?? 0;
              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={latest.dominant_fear === f.key ? "text-red-300 font-medium" : ""}>{f.name}</span>
                    <span className="tabular-nums">{v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={v >= FEAR_THRESHOLD ? "h-full bg-red-400" : "h-full bg-muted-foreground/40"}
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {dominantFear && (
              <p className="text-xs pt-2">
                <span className="text-red-300 font-medium">Strongest: {dominantFear.name}.</span>{" "}
                <span className="text-muted-foreground">{dominantFear.antidote}</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Scale className="h-4 w-4 text-purple-300" /> Maat alignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MAAT_PRINCIPLES.map((p) => {
              const v = latest.maat_scores[p.key] ?? 0;
              return (
                <div key={p.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{p.name}</span>
                    <span className="tabular-nums">{v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div className="h-full bg-purple-400" style={{ width: `${v}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" onClick={onStart} className="w-full gap-2">
        <Scale className="h-4 w-4" />
        Retake the Personal Analysis
      </Button>
    </div>
  );
}
