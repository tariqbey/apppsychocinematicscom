import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, Zap, CheckCircle, Circle, Film, Clapperboard, 
  Palette, Play, Download, Calendar, Target, User,
  ChevronRight, Sparkles, Image, Video, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Episode, useEpisodes } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { EditBay } from "@/components/studio/EditBay";

interface EpisodeProductionDashboardProps {
  episode: Episode;
  onClose: () => void;
  onOpenMindMovieWizard: () => void;
  chiefAim: {
    what?: string;
    byWhen?: string;
    exchange?: string;
    plan?: string;
  };
}

interface ScriptData {
  id: string;
  title: string | null;
  scenes: Array<{
    order: number;
    title: string;
    image_url?: string | null;
    video_url?: string | null;
  }> | null;
  movie_url: string | null;
  soundtrack_url: string | null;
}

type ProductionStep = "episode" | "script" | "visuals" | "edit" | "export";

export function EpisodeProductionDashboard({
  episode,
  onClose,
  onOpenMindMovieWizard,
  chiefAim,
}: EpisodeProductionDashboardProps) {
  const navigate = useNavigate();
  const { getDaysRemaining, getProgress } = useEpisodes();
  
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [showEditBay, setShowEditBay] = useState(false);
  
  const daysRemaining = getDaysRemaining(episode.deadline);
  const progress = getProgress(episode);

  // Fetch script data if episode has a linked script
  useEffect(() => {
    const fetchScript = async () => {
      if (!episode.mind_movie_script_id) return;
      
      setLoadingScript(true);
      try {
        const { data, error } = await supabase
          .from("mind_movie_scripts")
          .select("id, title, scenes, movie_url, soundtrack_url")
          .eq("id", episode.mind_movie_script_id)
          .single();
        
        if (!error && data) {
          setScriptData(data as ScriptData);
        }
      } catch (err) {
        console.error("Error fetching script:", err);
      } finally {
        setLoadingScript(false);
      }
    };
    
    fetchScript();
  }, [episode.mind_movie_script_id]);

  // Calculate production status
  const getProductionStatus = (): { 
    currentStep: ProductionStep; 
    completedSteps: ProductionStep[];
    progress: number;
  } => {
    const completedSteps: ProductionStep[] = ["episode"];
    let currentStep: ProductionStep = "script";
    
    if (scriptData) {
      completedSteps.push("script");
      currentStep = "visuals";
      
      // Check if visuals are generated
      const scenes = scriptData.scenes || [];
      const hasImages = scenes.some(s => s.image_url);
      const hasVideos = scenes.some(s => s.video_url);
      
      if (hasImages || hasVideos) {
        completedSteps.push("visuals");
        currentStep = "edit";
      }
      
      // Check if movie is exported
      if (scriptData.movie_url) {
        completedSteps.push("edit");
        completedSteps.push("export");
        currentStep = "export";
      }
    }
    
    const progressPercent = (completedSteps.length / 5) * 100;
    return { currentStep, completedSteps, progress: progressPercent };
  };
  
  const { currentStep, completedSteps, progress: productionProgress } = getProductionStatus();

  const steps: Array<{
    id: ProductionStep;
    label: string;
    description: string;
    icon: typeof Zap;
    action?: () => void;
    actionLabel?: string;
  }> = [
    {
      id: "episode",
      label: "Episode Created",
      description: episode.alignment_score 
        ? `Alignment: ${episode.alignment_score}%` 
        : "Ready to produce",
      icon: CheckCircle,
    },
    {
      id: "script",
      label: "Mind Movie Script",
      description: scriptData 
        ? `${scriptData.scenes?.length || 0} scenes ready`
        : "Create your episode storyboard",
      icon: Film,
      action: () => {
        onClose();
        onOpenMindMovieWizard();
      },
      actionLabel: scriptData ? "Edit Script" : "Create Script",
    },
    {
      id: "visuals",
      label: "Generate Visuals",
      description: (() => {
        if (!scriptData?.scenes) return "Generate images & videos for scenes";
        const images = scriptData.scenes.filter(s => s.image_url).length;
        const videos = scriptData.scenes.filter(s => s.video_url).length;
        return `${images} images • ${videos} videos`;
      })(),
      icon: Image,
      action: scriptData ? () => {
        onClose();
        onOpenMindMovieWizard();
      } : undefined,
      actionLabel: "Open Studio",
    },
    {
      id: "edit",
      label: "Edit & Animate",
      description: "Assemble scenes in the Timeline Editor",
      icon: Clapperboard,
      action: () => setShowEditBay(true),
      actionLabel: "Open Edit Bay",
    },
    {
      id: "export",
      label: "Export & Watch",
      description: scriptData?.movie_url 
        ? "Movie complete! Ready to watch"
        : "Save to vault and begin daily ritual",
      icon: Play,
      action: scriptData?.movie_url ? () => {
        // Navigate to theater with this movie
        navigate("/theater");
      } : undefined,
      actionLabel: "Watch Movie",
    },
  ];

  const isStepComplete = (stepId: ProductionStep) => completedSteps.includes(stepId);
  const isStepCurrent = (stepId: ProductionStep) => currentStep === stepId;
  const isStepLocked = (stepId: ProductionStep, index: number) => {
    // A step is locked if the previous required step isn't complete
    const requiredSteps: ProductionStep[] = ["episode", "script"];
    if (stepId === "visuals" && !completedSteps.includes("script")) return true;
    if (stepId === "edit" && !completedSteps.includes("script")) return true;
    if (stepId === "export" && !completedSteps.includes("edit")) return true;
    return false;
  };

  if (showEditBay) {
    return (
      <EditBay 
        onClose={() => setShowEditBay(false)}
        initialPrompt={episode.objective}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-background border border-border rounded-xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-600/10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display tracking-wide">{episode.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2">{episode.objective}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {daysRemaining > 0 ? `${daysRemaining} days left` : "Deadline passed"}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {episode.alignment_score ? `${episode.alignment_score}% aligned` : "Not scored"}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Production Progress */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Production Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(productionProgress)}%</span>
          </div>
          <Progress value={productionProgress} className="h-2" />
        </div>

        {/* Workflow Steps */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {loadingScript ? (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading production data...</p>
            </div>
          ) : (
            steps.map((step, index) => {
              const complete = isStepComplete(step.id);
              const current = isStepCurrent(step.id);
              const locked = isStepLocked(step.id, index);
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`
                    p-4 rounded-lg border transition-all
                    ${complete ? "border-green-500/30 bg-green-500/5" : ""}
                    ${current && !complete ? "border-amber-500/50 bg-amber-500/5" : ""}
                    ${locked ? "border-border/50 bg-muted/30 opacity-60" : ""}
                    ${!complete && !current && !locked ? "border-border hover:border-muted-foreground" : ""}
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Step indicator */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center shrink-0
                      ${complete ? "bg-green-500/20" : ""}
                      ${current && !complete ? "bg-amber-500/20" : ""}
                      ${locked || (!complete && !current) ? "bg-muted" : ""}
                    `}>
                      {complete ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : current ? (
                        <StepIcon className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${locked ? "text-muted-foreground" : ""}`}>
                        {index + 1}. {step.label}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>

                    {/* Action button */}
                    {step.action && !locked && (
                      <Button
                        size="sm"
                        variant={current && !complete ? "default" : "outline"}
                        className={current && !complete ? "bg-gradient-to-r from-amber-500 to-orange-600" : ""}
                        onClick={step.action}
                      >
                        {step.actionLabel}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Created {format(new Date(episode.created_at), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-2">
            {scriptData?.movie_url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-green-500/30 text-green-400"
                onClick={() => navigate("/theater")}
              >
                <Play className="w-4 h-4" />
                Watch Movie
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
