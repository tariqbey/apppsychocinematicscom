import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Zap,
  RefreshCw,
  Loader2,
  ChevronRight,
  Activity,
  Eye
} from "lucide-react";

interface CharacterAnalysis {
  assessment: string;
  strengths: string[];
  growthEdges: string[];
  patterns: string[];
  directorsNote: string;
  nextScene: string;
  overallScore: number;
}

interface AnalysisData {
  analysis: CharacterAnalysis;
  metrics: {
    taskCompletionRate: number;
    avgScorecardScore: number;
    completedChallenges: number;
    cutChallenges: number;
    totalChallenges: number;
    transformationCheckins: number;
    journalEntries: number;
    recentMoods: string[];
  };
  generatedAt: string;
}

export function AICharacterAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [expanded, setExpanded] = useState(false);

  const generateAnalysis = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-character-progress');
      
      if (error) throw error;
      
      setData(result);
      setExpanded(true);
      
      toast({
        title: "Analysis Complete",
        description: "Your Director AI has analyzed your character data.",
      });
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not generate character analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-gold";
    if (score >= 40) return "text-amber-500";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Oscar-Worthy";
    if (score >= 60) return "In Character";
    if (score >= 40) return "Rehearsing";
    return "Off-Script";
  };

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      {!data && (
        <Card className="bg-gradient-to-br from-purple-500/10 via-background to-gold/5 border-purple-500/30 overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-gold/30 flex items-center justify-center animate-pulse">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-display text-gold mb-2">Director AI Analysis</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Get an AI-powered breakdown of your character transformation progress based on your actions, journals, and scorecards.
            </p>
            <Button
              onClick={generateAnalysis}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-gold hover:from-purple-700 hover:to-amber-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {data && (
        <div className="space-y-4 animate-fade-in">
          {/* Overall Score Card */}
          <Card className="bg-gradient-to-br from-gold/10 via-background to-purple-500/5 border-gold/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/20 to-transparent rounded-bl-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-gold" />
                  Character Score
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateAnalysis}
                  disabled={loading}
                  className="text-muted-foreground hover:text-gold"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-muted/30"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${(data.analysis.overallScore / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--gold))" />
                        <stop offset="100%" stopColor="#9333ea" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(data.analysis.overallScore)}`}>
                      {data.analysis.overallScore}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <Badge className={`mb-2 ${getScoreColor(data.analysis.overallScore)} bg-current/10 border-current/30`}>
                    {getScoreLabel(data.analysis.overallScore)}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{data.analysis.assessment}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-card/50 border-border hover:border-gold/30 transition-colors">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-gold">{data.metrics.taskCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Task Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-gold/30 transition-colors">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-foreground">{data.metrics.avgScorecardScore}/12</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-gold/30 transition-colors">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-green-400">{data.metrics.completedChallenges}</p>
                <p className="text-xs text-muted-foreground">Challenges Won</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-gold/30 transition-colors">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-red-400">{data.metrics.cutChallenges}</p>
                <p className="text-xs text-muted-foreground">Cuts Called</p>
              </CardContent>
            </Card>
          </div>

          {/* Expandable Sections */}
          <Card className="bg-card/50 border-border">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gold" />
                  Full Analysis
                </span>
                <ChevronRight className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </CardTitle>
            </CardHeader>
            
            {expanded && (
              <CardContent className="space-y-6 pt-0 animate-fade-in">
                {/* Strengths */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-green-400 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Strengths Spotlight
                  </h4>
                  <div className="space-y-2">
                    {data.analysis.strengths.map((strength, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Edges */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-500 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Growth Edges
                  </h4>
                  <div className="space-y-2">
                    {data.analysis.growthEdges.map((edge, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{edge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patterns */}
                {data.analysis.patterns.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-purple-400 mb-3">
                      <Brain className="w-4 h-4" />
                      Pattern Recognition
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.analysis.patterns.map((pattern, i) => (
                        <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Director's Note */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-gold/10 to-purple-500/5 border border-gold/20">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gold mb-2">
                    🎬 Director's Note
                  </h4>
                  <p className="text-sm italic">{data.analysis.directorsNote}</p>
                </div>

                {/* Next Scene */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                    <Target className="w-4 h-4" />
                    Next Scene (Today's Action)
                  </h4>
                  <p className="text-sm font-medium">{data.analysis.nextScene}</p>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground text-center">
                  Analysis generated: {new Date(data.generatedAt).toLocaleString()}
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
