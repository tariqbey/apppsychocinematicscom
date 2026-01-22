import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMindMovies } from "@/hooks/useMindMovies";
import { useToast } from "@/hooks/use-toast";
import { 
  Film, 
  Sparkles, 
  Loader2, 
  Target,
  Lightbulb,
  Plus,
  ChevronRight,
  Eye,
  Video,
  Camera
} from "lucide-react";

interface MovieAnalysis {
  movieAnalysis: string;
  alignmentScore: number;
  todaysActions: Array<{
    action: string;
    connection: string;
  }>;
  directorsInsight: string;
  missingElement: string;
}

interface AnalysisResult {
  analysis: MovieAnalysis;
  movieTitle: string;
  sceneCount: number;
  generatedAt: string;
}

export function MindMovieAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { movies, activeMovie } = useMindMovies();
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Capture frames from video
  const captureFrames = useCallback(async (videoUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.muted = true;
      
      const frames: string[] = [];
      const targetFrameCount = 4;
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = duration / (targetFrameCount + 1);
        let captured = 0;
        
        const captureFrame = () => {
          if (captured >= targetFrameCount) {
            video.remove();
            resolve(frames);
            return;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            frames.push(dataUrl);
          }
          
          captured++;
          video.currentTime = interval * (captured + 1);
        };
        
        video.onseeked = captureFrame;
        video.currentTime = interval;
      };
      
      video.onerror = () => {
        console.error('Error loading video for frame capture');
        resolve([]);
      };
      
      video.load();
    });
  }, []);

  const analyzeMovie = async () => {
    if (!user || !activeMovie) {
      toast({
        title: "No Active Movie",
        description: "Please set an active Mind Movie first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setCapturing(true);
    
    try {
      // Capture frames if movie has a video URL
      let frameDataUrls: string[] = [];
      
      if (activeMovie.movie_url) {
        setCapturing(true);
        try {
          frameDataUrls = await captureFrames(activeMovie.movie_url);
        } catch (error) {
          console.error('Frame capture failed:', error);
          // Continue without frames
        }
        setCapturing(false);
      }

      const { data, error } = await supabase.functions.invoke('analyze-mind-movie', {
        body: {
          scriptId: activeMovie.id,
          frameDataUrls: frameDataUrls.length > 0 ? frameDataUrls : undefined
        }
      });

      if (error) throw error;

      setResult(data);
      setExpanded(true);
      
      toast({
        title: "Analysis Complete",
        description: "Your Mind Movie has been analyzed with today's action suggestions.",
      });
    } catch (error) {
      console.error('Error analyzing mind movie:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze your Mind Movie.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setCapturing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-500/20";
    if (score >= 60) return "text-gold bg-gold/20";
    if (score >= 40) return "text-amber-500 bg-amber-500/20";
    return "text-red-400 bg-red-500/20";
  };

  if (!activeMovie && movies.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-background to-gold/5 border-purple-500/30 overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500/20 via-transparent to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold/10 via-transparent to-transparent rounded-tr-full" />
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/30 to-gold/30">
            <Film className="w-5 h-5 text-purple-400" />
          </div>
          Mind Movie Analyzer
          <Badge variant="outline" className="ml-auto border-purple-500/30 text-purple-400 text-xs">
            Gemini Vision
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {!result ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-gold/30 flex items-center justify-center">
              {capturing ? (
                <Camera className="w-8 h-8 text-purple-400 animate-pulse" />
              ) : (
                <Video className="w-8 h-8 text-purple-400" />
              )}
            </div>
            
            <h3 className="text-lg font-display text-gold mb-2">
              {activeMovie?.title || "Your Mind Movie"}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {capturing 
                ? "Capturing key frames from your movie..."
                : "Gemini will analyze your Mind Movie's visuals and scenes to suggest daily actions aligned with your vision."
              }
            </p>
            
            <Button
              onClick={analyzeMovie}
              disabled={loading || !activeMovie}
              className="bg-gradient-to-r from-purple-600 to-gold hover:from-purple-700 hover:to-amber-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {capturing ? "Capturing Frames..." : "Analyzing..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze My Movie
                </>
              )}
            </Button>
            
            {!activeMovie && (
              <p className="text-xs text-muted-foreground mt-3">
                No active movie selected. Go to Mind Movies to set one.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Score and Title */}
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl font-bold text-xl ${getScoreColor(result.analysis.alignmentScore)}`}>
                {result.analysis.alignmentScore}%
              </div>
              <div className="flex-1">
                <p className="font-medium">{result.movieTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {result.sceneCount} scenes analyzed • Alignment Score
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeMovie}
                disabled={loading}
              >
                <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Analysis Summary */}
            <p className="text-sm text-muted-foreground">
              {result.analysis.movieAnalysis}
            </p>

            {/* Today's Actions */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gold">
                <Target className="w-4 h-4" />
                Today's Vision-Aligned Actions
              </h4>
              {result.analysis.todaysActions.map((action, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card/60 border border-border/50 hover:border-gold/30 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.connection}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Expandable Insights */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-purple-400">
                <Lightbulb className="w-4 h-4" />
                Director's Insights
              </span>
              <ChevronRight className={`w-4 h-4 text-purple-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            
            {expanded && (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3 rounded-lg bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
                  <h5 className="text-xs font-medium text-gold mb-1">🎬 Director's Insight</h5>
                  <p className="text-sm">{result.analysis.directorsInsight}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                  <h5 className="text-xs font-medium text-purple-400 mb-1">✨ Missing Element</h5>
                  <p className="text-sm">{result.analysis.missingElement}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
