import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Archive, 
  Calendar, 
  ChevronRight, 
  Trash2,
  TrendingUp,
  Activity,
  Loader2
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
}

interface SavedAnalysisArchiveProps {
  onNewAnalysis?: () => void;
}

export function SavedAnalysisArchive({ onNewAnalysis }: SavedAnalysisArchiveProps) {
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
    
    try {
      const { data, error } = await supabase
        .from('saved_character_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAnalyses((data as SavedAnalysis[]) || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_character_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Analysis Deleted",
        description: "The saved analysis has been removed.",
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
      <Card className="bg-card/50 border-border">
        <CardContent className="text-center py-8">
          <Archive className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground mb-4">No saved analyses yet</p>
          <Button onClick={onNewAnalysis} variant="outline" size="sm">
            Generate Your First Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-gold" />
            Analysis Archive
          </span>
          <Badge variant="secondary" className="text-xs">
            {analyses.length} saved
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {analyses.map((item) => (
              <div 
                key={item.id}
                className="border border-border/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${getScoreColor(item.analysis.overallScore)}`}>
                      {item.analysis.overallScore}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Activity className="w-3 h-3" />
                        <span>{item.metrics.taskCompletionRate}% tasks</span>
                        <TrendingUp className="w-3 h-3 ml-2" />
                        <span>{item.metrics.avgScorecardScore}/12 avg</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnalysis(item.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === item.id ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                
                {expandedId === item.id && (
                  <div className="px-3 pb-3 border-t border-border/30 pt-3 space-y-3 animate-fade-in">
                    <p className="text-sm text-muted-foreground">{item.analysis.assessment}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-500/10 rounded p-2">
                        <span className="text-green-400 font-medium">Strengths:</span>
                        <ul className="mt-1 space-y-0.5">
                          {item.analysis.strengths.slice(0, 2).map((s, i) => (
                            <li key={i} className="truncate">{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-500/10 rounded p-2">
                        <span className="text-amber-400 font-medium">Growth:</span>
                        <ul className="mt-1 space-y-0.5">
                          {item.analysis.growthEdges.slice(0, 2).map((e, i) => (
                            <li key={i} className="truncate">{e}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-gold/10 rounded p-2 text-xs">
                      <span className="text-gold font-medium">Director's Note:</span>
                      <p className="mt-1 italic line-clamp-2">{item.analysis.directorsNote}</p>
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
