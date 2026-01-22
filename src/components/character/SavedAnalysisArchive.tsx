import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { 
  Archive, 
  Calendar, 
  ChevronRight, 
  Trash2,
  TrendingUp,
  Activity,
  Loader2,
  Sparkles
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

// Placeholder component - database table pending migration approval
export function SavedAnalysisArchive({ onNewAnalysis }: SavedAnalysisArchiveProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses] = useState<SavedAnalysis[]>([]);
  const [loading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // Show placeholder until database table is created
  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-card/50 to-gold/5 border-purple-500/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
      <CardContent className="text-center py-8 relative">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-gold/30 flex items-center justify-center">
          <Archive className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-display text-gold mb-2">Analysis Archive</h3>
        <p className="text-muted-foreground mb-4 text-sm max-w-xs mx-auto">
          Save and track your AI character analyses over time. Generate an analysis above to begin building your archive.
        </p>
        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
          <Sparkles className="w-3 h-3 mr-1" />
          Coming Soon
        </Badge>
      </CardContent>
    </Card>
  );
}
