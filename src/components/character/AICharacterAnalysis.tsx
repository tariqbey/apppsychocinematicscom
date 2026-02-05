import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Eye,
  Save,
  BookOpen,
  Archive,
  Trash2,
  Calendar,
  Star,
  GitCompare,
  X,
  Music
} from "lucide-react";
import { Circle } from "lucide-react";
import { format } from "date-fns";

interface NapoleonHillLaw {
  lawNumber: number;
  lawName: string;
  application: string;
}

interface CharacterAnalysis {
  assessment: string;
  strengths: string[];
  growthEdges: string[];
  patterns: string[];
  archetypeAlignment?: string;
  napoleonHillPrescription?: NapoleonHillLaw[];
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
  napoleonHillLaws?: Array<{ lawNumber: number; name: string; application: string; quote: string }>;
  chiefAimSnapshot?: {
    what: string;
    byWhen: string;
    exchange: string;
    plan: string;
  };
  generatedAt: string;
  archetype?: {
    id: string;
    name: string;
    sphere: number;
    deity: string;
    law: string;
    role: string;
    directorsNote: string;
  } | null;
}

interface SavedAnalysis {
  id: string;
  created_at: string;
  analysis: CharacterAnalysis;
  metrics: AnalysisData['metrics'];
  napoleon_hill_laws: AnalysisData['napoleonHillLaws'];
  chief_aim_snapshot: AnalysisData['chiefAimSnapshot'];
}

export function AICharacterAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<SavedAnalysis[]>([]);

  // Fetch saved analyses on mount
  useEffect(() => {
    if (user) {
      fetchSavedAnalyses();
    }
  }, [user]);

  const fetchSavedAnalyses = async () => {
    if (!user) return;
    
    setLoadingArchive(true);
    try {
      const { data: analyses, error } = await supabase
        .from('saved_character_analyses' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setSavedAnalyses((analyses || []) as unknown as SavedAnalysis[]);
    } catch (error) {
      console.error('Error fetching saved analyses:', error);
    } finally {
      setLoadingArchive(false);
    }
  };

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
        description: "Your Director AI has analyzed your character data with Napoleon Hill guidance.",
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

  const saveAnalysis = async () => {
    if (!user || !data) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('saved_character_analyses' as any)
        .insert({
          user_id: user.id,
          analysis: data.analysis,
          metrics: data.metrics,
          napoleon_hill_laws: data.napoleonHillLaws,
          chief_aim_snapshot: data.chiefAimSnapshot
        });
      
      if (error) throw error;
      
      toast({
        title: "Analysis Saved",
        description: "Your character analysis has been saved to your archive.",
      });
      
      fetchSavedAnalyses();
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('saved_character_analyses' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSavedAnalyses(prev => prev.filter(a => a.id !== id));
      
      toast({
        title: "Analysis Deleted",
        description: "The saved analysis has been removed.",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the analysis.",
        variant: "destructive"
      });
    }
  };

  const loadSavedAnalysis = (saved: SavedAnalysis) => {
    setData({
      analysis: saved.analysis,
      metrics: saved.metrics,
      napoleonHillLaws: saved.napoleon_hill_laws,
      chiefAimSnapshot: saved.chief_aim_snapshot,
      generatedAt: saved.created_at
    });
    setExpanded(true);
    setShowArchive(false);
  };

  const toggleCompareSelection = (saved: SavedAnalysis) => {
    if (compareSelection.find(s => s.id === saved.id)) {
      setCompareSelection(prev => prev.filter(s => s.id !== saved.id));
    } else if (compareSelection.length < 2) {
      setCompareSelection(prev => [...prev, saved]);
    } else {
      toast({
        title: "Maximum 2 analyses",
        description: "You can compare up to 2 analyses at a time.",
      });
    }
  };

  const getMostRelevantLaw = (laws: AnalysisData['napoleonHillLaws']) => {
    if (!laws || laws.length === 0) return null;
    // The first law is the most relevant based on the AI's prioritization
    return laws[0];
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
      {/* Archive Toggle */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={showArchive ? "outline" : "default"}
          size="sm"
          onClick={() => { setShowArchive(false); setCompareMode(false); setCompareSelection([]); }}
          className={!showArchive ? "bg-gold hover:bg-gold/90 text-black" : ""}
        >
          <Brain className="w-4 h-4 mr-2" />
          Analysis
        </Button>
        <Button
          variant={showArchive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchive(true)}
          className={showArchive ? "bg-gold hover:bg-gold/90 text-black" : ""}
        >
          <Archive className="w-4 h-4 mr-2" />
          Saved ({savedAnalyses.length})
        </Button>
        {showArchive && savedAnalyses.length >= 2 && (
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareSelection([]);
            }}
            className={compareMode ? "bg-purple-600 hover:bg-purple-700" : "border-purple-500/50 text-purple-400"}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </Button>
        )}
      </div>

      {/* Side-by-Side Comparison View */}
      {showArchive && compareMode && compareSelection.length === 2 && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-gold/5 border-purple-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitCompare className="w-5 h-5 text-purple-400" />
                Transformation Comparison
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompareSelection([])}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {compareSelection.map((analysis, idx) => (
                <div key={analysis.id} className="space-y-3">
                  <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-2xl font-bold ${getScoreColor(analysis.analysis.overallScore)}`}>
                        {analysis.analysis.overallScore}
                      </span>
                      <Badge className={`${getScoreColor(analysis.analysis.overallScore)} bg-current/10 border-current/30 text-xs`}>
                        {getScoreLabel(analysis.analysis.overallScore)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <p className="font-bold text-gold">{analysis.metrics.taskCompletionRate}%</p>
                      <p className="text-muted-foreground">Tasks</p>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <p className="font-bold">{analysis.metrics.avgScorecardScore}/12</p>
                      <p className="text-muted-foreground">Score</p>
                    </div>
                  </div>

                  {analysis.napoleon_hill_laws && analysis.napoleon_hill_laws.length > 0 && (
                    <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                      <p className="text-xs font-semibold text-purple-400 mb-1">Top Law</p>
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">
                        #{analysis.napoleon_hill_laws[0].lawNumber} {analysis.napoleon_hill_laws[0].name}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Score Difference */}
            <div className="mt-4 p-3 rounded-lg bg-gold/10 border border-gold/30 text-center">
              <p className="text-sm font-semibold text-gold">
                {compareSelection[1].analysis.overallScore - compareSelection[0].analysis.overallScore > 0 ? '+' : ''}
                {compareSelection[1].analysis.overallScore - compareSelection[0].analysis.overallScore} points
              </p>
              <p className="text-xs text-muted-foreground">Score change between analyses</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archive View */}
      {showArchive && !(compareMode && compareSelection.length === 2) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="w-5 h-5 text-gold" />
              {compareMode ? `Select 2 Analyses to Compare (${compareSelection.length}/2)` : "Saved Analyses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingArchive ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedAnalyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved analyses yet.</p>
                <p className="text-sm">Generate an analysis and save it to track your progress over time.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {savedAnalyses.map((saved) => {
                    const isSelected = compareSelection.find(s => s.id === saved.id);
                    return (
                      <div
                        key={saved.id}
                        className={`p-4 rounded-lg border transition-colors bg-background/50 cursor-pointer ${
                          compareMode 
                            ? isSelected 
                              ? 'border-purple-500 bg-purple-500/10' 
                              : 'border-border hover:border-purple-500/50'
                            : 'border-border hover:border-gold/50'
                        }`}
                        onClick={() => compareMode && toggleCompareSelection(saved)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getScoreColor(saved.analysis.overallScore)} bg-current/10 border-current/30`}>
                                {saved.analysis.overallScore}/100
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {getScoreLabel(saved.analysis.overallScore)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(saved.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          {!compareMode && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); loadSavedAnalysis(saved); }}
                                className="text-gold hover:text-gold/80"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); deleteAnalysis(saved.id); }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {compareMode && (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2">{saved.analysis.assessment}</p>
                        {saved.napoleon_hill_laws && saved.napoleon_hill_laws.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {saved.napoleon_hill_laws.slice(0, 3).map((law, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                Law #{law.lawNumber}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Analysis View */}
      {!showArchive && (
        <>
          {/* Generate Button */}
          {!data && (
            <Card className="bg-gradient-to-br from-purple-500/10 via-background to-gold/5 border-purple-500/30 overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-gold/30 flex items-center justify-center animate-pulse">
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-display text-gold mb-2">Director AI Analysis</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Get an AI-powered breakdown of your character transformation with Napoleon Hill's Laws of Success guidance.
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

              {/* Save & Convert to Song CTA */}
              <Card className="bg-gradient-to-r from-gold/20 via-purple-500/10 to-gold/20 border-gold/50">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4">
                    <div className="text-center sm:text-left">
                      <h4 className="font-semibold text-gold mb-1">Save This Analysis</h4>
                      <p className="text-xs text-muted-foreground">
                        Archive your progress to track transformation over time, or convert it into an affirmation song.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={saveAnalysis}
                        disabled={saving}
                        className="bg-gold hover:bg-gold/90 text-black flex-1"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save to Archive
                      </Button>
                      <Button
                        onClick={() => {
                          // Build lyrics context from analysis
                          const lyricsContext = [
                            `My Character Analysis Score: ${data.analysis.overallScore}/100 - ${getScoreLabel(data.analysis.overallScore)}`,
                            "",
                            `Assessment: ${data.analysis.assessment}`,
                            "",
                            `My Strengths: ${data.analysis.strengths?.join(", ") || "N/A"}`,
                            "",
                            `Growth Edges to overcome: ${data.analysis.growthEdges?.join(", ") || "N/A"}`,
                            "",
                            data.napoleonHillLaws?.[0] ? `Most Relevant Napoleon Hill Law: #${data.napoleonHillLaws[0].lawNumber} ${data.napoleonHillLaws[0].name}\nApplication: ${data.napoleonHillLaws[0].application}` : "",
                            "",
                            `Director's Note: ${data.analysis.directorsNote}`,
                            "",
                            `My Next Action: ${data.analysis.nextScene}`,
                          ].filter(Boolean).join("\n");
                          
                          // Store in session for the Soundtrack page
                          sessionStorage.setItem("analysis-lyrics-context", lyricsContext);
                          navigate("/soundtrack?fromAnalysis=true");
                        }}
                        variant="outline"
                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 flex-1"
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Create Song from Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Archetype Alignment - Metu Neter Section */}
              {(data.archetype || data.analysis.archetypeAlignment) && (
                <Card className="bg-gradient-to-br from-amber-500/10 via-background to-gold/5 border-amber-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Circle className="w-5 h-5 text-amber-500" />
                      Archetype Alignment
                      {data.archetype && (
                        <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Sphere {data.archetype.sphere}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.archetype && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-gold/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-amber-400">{data.archetype.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-semibold text-amber-400/80">Deity:</span> {data.archetype.deity}
                        </p>
                        <p className="text-sm mb-2">
                          <span className="font-semibold text-gold">The Law:</span> {data.archetype.law}
                        </p>
                        <p className="text-xs text-muted-foreground italic border-l-2 border-amber-500/30 pl-2">
                          "{data.archetype.directorsNote}"
                        </p>
                      </div>
                    )}
                    {data.analysis.archetypeAlignment && (
                      <div className="p-3 rounded-lg bg-card/50 border border-border">
                        <h5 className="text-sm font-semibold text-gold mb-1">Your Alignment Assessment</h5>
                        <p className="text-sm text-muted-foreground">{data.analysis.archetypeAlignment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Napoleon Hill Prescription - Most Relevant First */}
              {data.napoleonHillLaws && data.napoleonHillLaws.length > 0 && (
                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                      Napoleon Hill Prescription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Most Relevant Law - Highlighted */}
                    {data.napoleonHillLaws.length > 0 && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-gold/20 to-purple-500/20 border-2 border-gold/50 relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gold text-black text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Most Relevant
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2 mt-4 sm:mt-0">
                          <Badge variant="outline" className="border-gold/50 text-gold">
                            Law #{data.napoleonHillLaws[0].lawNumber}
                          </Badge>
                          <span className="font-bold text-gold">{data.napoleonHillLaws[0].name}</span>
                        </div>
                        <p className="text-sm">{data.napoleonHillLaws[0].application}</p>
                        {data.napoleonHillLaws[0].quote && (
                          <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-gold/30 pl-2">
                            "{data.napoleonHillLaws[0].quote}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Other Laws */}
                    {data.napoleonHillLaws.slice(1).map((law, i) => (
                      <div key={i} className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                            Law #{law.lawNumber}
                          </Badge>
                          <span className="font-semibold text-sm">{law.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{law.application}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Fallback to old format if napoleonHillLaws not present */}
              {!data.napoleonHillLaws && data.analysis.napoleonHillPrescription && data.analysis.napoleonHillPrescription.length > 0 && (
                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                      Napoleon Hill Prescription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.analysis.napoleonHillPrescription.map((law, i) => (
                      <div key={i} className={`p-3 rounded-lg ${i === 0 ? 'bg-gradient-to-r from-gold/20 to-purple-500/20 border-2 border-gold/50' : 'bg-purple-500/10 border border-purple-500/20'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {i === 0 && (
                            <Badge className="bg-gold text-black text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Most Relevant
                            </Badge>
                          )}
                          <Badge variant="outline" className={i === 0 ? "border-gold/50 text-gold" : "border-purple-500/50 text-purple-400"}>
                            Law #{law.lawNumber}
                          </Badge>
                          <span className={`font-semibold text-sm ${i === 0 ? 'text-gold' : ''}`}>{law.lawName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{law.application}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

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
        </>
      )}
    </div>
  );
}
