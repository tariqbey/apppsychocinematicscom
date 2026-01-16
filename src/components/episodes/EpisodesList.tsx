import { useState } from "react";
import { Zap, Plus, Filter, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEpisodes, Episode } from "@/hooks/useEpisodes";
import { EpisodeCard } from "./EpisodeCard";
import { EpisodeWizard } from "./EpisodeWizard";
import { EpisodeTimeline } from "./EpisodeTimeline";
import { MindMovieScriptWizard } from "@/components/mind-movie/MindMovieScriptWizard";
import { supabase } from "@/integrations/supabase/client";

type StatusFilter = "all" | "active" | "completed" | "paused" | "abandoned";

export function EpisodesList() {
  const { episodes, loading, updateEpisode, deleteEpisode, completeEpisode, pauseEpisode, resumeEpisode } = useEpisodes();
  const [showWizard, setShowWizard] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [activeView, setActiveView] = useState<"list" | "timeline">("list");
  const [movieWizardEpisode, setMovieWizardEpisode] = useState<Episode | null>(null);
  const [chiefAim, setChiefAim] = useState<{ what?: string; byWhen?: string; exchange?: string; plan?: string }>({});

  // Fetch chief aim for movie wizard
  const fetchChiefAim = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("user_profiles")
      .select("chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setChiefAim({
        what: data.chief_aim_what || undefined,
        byWhen: data.chief_aim_by_when || undefined,
        exchange: data.chief_aim_exchange || undefined,
        plan: data.chief_aim_plan || undefined,
      });
    }
  };

  const handleCreateMindMovie = async (episode: Episode) => {
    await fetchChiefAim();
    setMovieWizardEpisode(episode);
  };

  const handleEpisodeMovieCreated = async (scriptId: string) => {
    if (movieWizardEpisode) {
      await updateEpisode(movieWizardEpisode.id, { mind_movie_script_id: scriptId });
      setMovieWizardEpisode(null);
    }
  };

  const filteredEpisodes = episodes.filter(ep => 
    filter === "all" ? true : ep.status === filter
  );

  const filterLabels: Record<StatusFilter, string> = {
    all: "All Episodes",
    active: "Active",
    completed: "Completed",
    paused: "Paused",
    abandoned: "Abandoned"
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="animate-pulse text-muted-foreground">Loading episodes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-display tracking-wide">Episodes</h2>
            <p className="text-sm text-muted-foreground">
              {episodes.filter(e => e.status === "active").length} active • {episodes.filter(e => e.status === "completed").length} completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "list" | "timeline")}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="text-xs px-3">
                <Zap className="w-3 h-3 mr-1" />
                List
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs px-3">
                <Clock className="w-3 h-3 mr-1" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeView === "list" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {filterLabels[filter]}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border">
                {(Object.keys(filterLabels) as StatusFilter[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setFilter(key)}
                    className={filter === key ? "bg-muted" : ""}
                  >
                    {filterLabels[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            onClick={() => setShowWizard(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Episode
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      {activeView === "timeline" && (
        <EpisodeTimeline episodes={episodes} />
      )}

      {/* List View */}
      {activeView === "list" && (
        <>
          {filteredEpisodes.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Zap className="w-12 h-12 text-amber-500/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {filter === "all" ? "No Episodes Yet" : `No ${filterLabels[filter]} Episodes`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === "all" 
                  ? "Episodes are short-term sprints that support your main Chief Aim."
                  : "Try changing the filter to see other episodes."
                }
              </p>
              {filter === "all" && (
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  onClick={() => setShowWizard(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Episode
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEpisodes.map((episode) => (
                <EpisodeCard 
                  key={episode.id} 
                  episode={episode} 
                  onCreateMindMovie={() => handleCreateMindMovie(episode)}
                  onDelete={deleteEpisode}
                  onComplete={completeEpisode}
                  onPause={pauseEpisode}
                  onResume={resumeEpisode}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Episode Wizard Modal */}
      {showWizard && (
        <EpisodeWizard onClose={() => setShowWizard(false)} />
      )}

      {/* Mind Movie Wizard for Episodes */}
      {movieWizardEpisode && (
        <MindMovieScriptWizard
          isOpen={!!movieWizardEpisode}
          onClose={() => setMovieWizardEpisode(null)}
          chiefAim={chiefAim}
          episodeMode={true}
          episode={{
            id: movieWizardEpisode.id,
            title: movieWizardEpisode.title,
            objective: movieWizardEpisode.objective,
            deadline: movieWizardEpisode.deadline,
            alignment_score: movieWizardEpisode.alignment_score,
          }}
          onEpisodeMovieCreated={handleEpisodeMovieCreated}
        />
      )}
    </div>
  );
}
