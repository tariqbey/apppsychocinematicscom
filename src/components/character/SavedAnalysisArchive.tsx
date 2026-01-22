import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Archive, 
  Calendar, 
  ChevronRight, 
  Trash2,
  TrendingUp,
  Activity,
  Loader2,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SavedAnalysis {
  id: string;
  created_at: string;
  analysis: {
    assessment: string;
    strengths: string[];
    growthEdges: string[];
    patterns: string[];
    directorsNote: string;
    nextScene: string;
    overallScore: number;
  };
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
  napoleon_hill_laws?: Array<{ lawNumber: number; name: string; application: string; quote: string }>;
}

interface SavedAnalysisArchiveProps {
  onViewAnalysis?: (analysis: SavedAnalysis) => void;
}

export function SavedAnalysisArchive({ onViewAnalysis }: SavedAnalysisArchiveProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_character_analyses' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setAnalyses((data || []) as unknown as SavedAnalysis[]);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Error",
        description: "Could not load saved analyses.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Deleted",
        description: "Analysis removed from archive."
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Could not delete analysis.",
        variant: "destructive"
      });
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

  if (loading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 via-card/50 to-gold/5 border-purple-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
        <CardContent className="text-center py-8 relative">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-gold/30 flex items-center justify-center">
            <Archive className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-display text-gold mb-2">Analysis Archive</h3>
          <p className="text-muted-foreground mb-4 text-sm max-w-xs mx-auto">
            Your saved AI character analyses will appear here. Generate an analysis and save it to begin tracking your transformation journey.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Archive className="w-5 h-5 text-gold" />
          Analysis Archive ({analyses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="p-4 rounded-lg border border-border hover:border-gold/50 transition-colors bg-background/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getScoreColor(analysis.analysis.overallScore)} bg-current/10 border-current/30`}>
                        {analysis.analysis.overallScore}/100
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getScoreLabel(analysis.analysis.overallScore)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(analysis.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                      className="text-gold hover:text-gold/80"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === analysis.id ? 'rotate-90' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnalysis(analysis.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm line-clamp-2 mb-2">{analysis.analysis.assessment}</p>
                
                {/* Quick metrics */}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {analysis.metrics.taskCompletionRate}% tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {analysis.metrics.avgScorecardScore}/12 avg
                  </span>
                </div>

                {/* Napoleon Hill Laws badges */}
                {analysis.napoleon_hill_laws && analysis.napoleon_hill_laws.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {analysis.napoleon_hill_laws.slice(0, 3).map((law, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                        Law #{law.lawNumber}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Expanded details */}
                {expandedId === analysis.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                    <div>
                      <h5 className="text-xs font-semibold text-green-400 mb-1">Strengths</h5>
                      <ul className="text-xs space-y-1">
                        {analysis.analysis.strengths.map((s, i) => (
                          <li key={i} className="text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-amber-500 mb-1">Growth Edges</h5>
                      <ul className="text-xs space-y-1">
                        {analysis.analysis.growthEdges.map((g, i) => (
                          <li key={i} className="text-muted-foreground">• {g}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-gold/10 border border-gold/20">
                      <h5 className="text-xs font-semibold text-gold mb-1">Director's Note</h5>
                      <p className="text-xs italic">{analysis.analysis.directorsNote}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
