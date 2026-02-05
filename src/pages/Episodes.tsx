 import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
 import { Zap, Plus, ArrowLeft, Film, Clapperboard, Sparkles, Target, Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useEpisodes, Episode } from "@/hooks/useEpisodes";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { EpisodeWizard } from "@/components/episodes/EpisodeWizard";
import { EpisodeProductionDashboard } from "@/components/episodes/EpisodeProductionDashboard";
import { EpisodeTimeline } from "@/components/episodes/EpisodeTimeline";
import { ActiveEpisodeBanner } from "@/components/episodes/ActiveEpisodeBanner";
import { MindMovieScriptWizard } from "@/components/mind-movie/MindMovieScriptWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EpisodeCharacterTransformation } from "@/components/episodes/EpisodeTransformationCard";
 import { EpisodeDetailView } from "@/components/episodes/EpisodeDetailView";
 import { EpisodeCharacterDashboard } from "@/components/dashboard/EpisodeCharacterDashboard";
 import { ChallengeCard } from "@/components/challenges/ChallengeCard";
 import { supabase } from "@/integrations/supabase/client";
 import { Card } from "@/components/ui/card";
 import { ScrollArea } from "@/components/ui/scroll-area";

 interface AdversityChallenge {
   id: string;
   user_id: string;
   scenario_type: string;
   target_trait: string;
   situation_description: string;
   emotional_trigger: string;
   challenge_date: string;
   completed: boolean;
   response_type: string | null;
   feeling: string | null;
   part_challenged: string | null;
   did_cut: boolean | null;
   cut_notes: string | null;
   insight_gained: string | null;
   action_taken: string | null;
   at_peace: boolean | null;
   trait_xp_earned: number | null;
   created_at: string;
   storyboard_scenes?: unknown;
   storyboard_reference_photo?: string | null;
   storyboard_created_at?: string | null;
   visualization_script?: string | null;
   ideal_response?: string | null;
   affirmation?: string | null;
 }

export default function Episodes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { episodes, activeEpisode, loading, updateEpisode, deleteEpisode, completeEpisode, pauseEpisode, resumeEpisode } = useEpisodes();
  
  const [showWizard, setShowWizard] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [showProductionDashboard, setShowProductionDashboard] = useState(false);
  
  // Mind Movie Wizard state
  const [movieWizardEpisode, setMovieWizardEpisode] = useState<Episode | null>(null);
  const [characterAnalysis, setCharacterAnalysis] = useState<EpisodeCharacterTransformation | null>(null);
   
   // Detail View state
   const [detailViewEpisode, setDetailViewEpisode] = useState<Episode | null>(null);
   
   // Challenges state
   const [challenges, setChallenges] = useState<AdversityChallenge[]>([]);
   const [loadingChallenges, setLoadingChallenges] = useState(false);
   
   const fetchChallenges = useCallback(async () => {
     if (!user) return;
     
     setLoadingChallenges(true);
     try {
       const { data, error } = await supabase
         .from("adversity_challenges")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(10);
 
       if (error) throw error;
       setChallenges(data || []);
     } catch (error) {
       console.error("Error fetching challenges:", error);
     } finally {
       setLoadingChallenges(false);
     }
   }, [user]);
   
   useEffect(() => {
     if (user) {
       fetchChallenges();
     }
   }, [user, fetchChallenges]);
  
  const chiefAim = {
    what: profile?.chief_aim_what || "",
    byWhen: profile?.chief_aim_by_when || "",
    exchange: profile?.chief_aim_exchange || "",
    plan: profile?.chief_aim_plan || ""
  };

  // Redirect to landing if not logged in (only after auth state is loaded)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Handle opening production dashboard from URL or direct click
  const handleOpenProduction = (episode: Episode) => {
    setSelectedEpisode(episode);
    setShowProductionDashboard(true);
  };

  // Handle mind movie creation from EpisodeWizard
  const handleCreateMindMovie = (
    episodeId: string, 
    episode: { id: string; title: string; objective: string; deadline: string; alignment_score: number | null },
    analysis: EpisodeCharacterTransformation
  ) => {
    const fullEpisode = episodes.find(e => e.id === episodeId);
    if (fullEpisode) {
      setCharacterAnalysis(analysis);
      setMovieWizardEpisode(fullEpisode);
      // Store character analysis in sessionStorage for MindMovieScriptWizard
      sessionStorage.setItem('episodeCharacterAnalysis', JSON.stringify(analysis));
      sessionStorage.setItem('episodeData', JSON.stringify(episode));
    }
  };

  // Handle mind movie creation from EpisodeCard
  const handleCardCreateMindMovie = async (episode: Episode) => {
    // Try to get cached character analysis from episode creation
    const cached = sessionStorage.getItem('episodeCharacterAnalysis');
    if (cached) {
      try {
        setCharacterAnalysis(JSON.parse(cached));
      } catch {
        // If parsing fails, proceed without cached analysis
      }
    }
    setMovieWizardEpisode(episode);
  };

  // Handle editing existing mind movie from EpisodeCard
  const handleEditMindMovie = (episode: Episode) => {
    // Open the wizard with the existing script ID - it will load at the Visuals step
    setMovieWizardEpisode(episode);
  };

  // Handle episode movie created
  const handleEpisodeMovieCreated = async (scriptId: string) => {
    if (movieWizardEpisode) {
      await updateEpisode(movieWizardEpisode.id, { mind_movie_script_id: scriptId });
      setMovieWizardEpisode(null);
      setCharacterAnalysis(null);
      sessionStorage.removeItem('episodeCharacterAnalysis');
      sessionStorage.removeItem('episodeData');
    }
  };

  // Handle wizard success and potentially open production dashboard
  const handleWizardSuccess = (episodeId: string) => {
    const episode = episodes.find(e => e.id === episodeId);
    if (episode) {
      // Immediately show production dashboard for the new episode
      setTimeout(() => {
        const refreshedEpisode = episodes.find(e => e.id === episodeId);
        if (refreshedEpisode) {
          handleOpenProduction(refreshedEpisode);
        }
      }, 500);
    }
  };

  const activeEpisodes = episodes.filter(e => e.status === "active");
  const completedEpisodes = episodes.filter(e => e.status === "completed");
  const otherEpisodes = episodes.filter(e => e.status === "paused" || e.status === "abandoned");

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-gold animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-display tracking-wide">Episodes</h1>
              <p className="text-muted-foreground">
                Short-term sprints that support your Definite Chief Aim
              </p>
            </div>
          </div>

          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 gap-2"
            onClick={() => setShowWizard(true)}
          >
            <Plus className="w-4 h-4" />
            New Episode
          </Button>
        </div>

        {/* Active Episode Banner */}
        {activeEpisode && (
          <div className="mb-8">
            <ActiveEpisodeBanner 
              onContinueProduction={() => handleOpenProduction(activeEpisode)}
            />
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="episodes" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="episodes" className="gap-2">
              <Zap className="w-4 h-4" />
              All Episodes
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clapperboard className="w-4 h-4" />
              Timeline
            </TabsTrigger>
             <TabsTrigger value="challenges" className="gap-2">
               <Target className="w-4 h-4" />
               Challenges
             </TabsTrigger>
          </TabsList>

           <TabsContent value="episodes" className="space-y-6">
             {/* Episode Character Dashboard - Show for active episode */}
             {activeEpisode?.character_transformation && (
               <EpisodeCharacterDashboard episode={activeEpisode} />
             )}
             
            {loading ? (
              <div className="glass-card p-12 text-center">
                <Sparkles className="w-10 h-10 text-gold animate-pulse mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your episodes...</p>
              </div>
            ) : episodes.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Zap className="w-16 h-16 text-amber-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-display mb-2">No Episodes Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Episodes are focused sprints that break your big goal into achievable milestones. 
                  Each episode includes a character analysis and optional Mind Movie.
                </p>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  onClick={() => setShowWizard(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Episode
                </Button>
              </div>
            ) : (
              <>
                {/* Active Episodes */}
                {activeEpisodes.length > 0 && (
                  <section>
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Active Episodes
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {activeEpisodes.map((episode) => (
                        <EpisodeCard 
                          key={episode.id}
                          episode={episode} 
                          variant="full"
                          onCreateMindMovie={() => handleCardCreateMindMovie(episode)}
                          onEditMindMovie={() => handleEditMindMovie(episode)}
                          onDelete={deleteEpisode}
                          onComplete={completeEpisode}
                          onPause={pauseEpisode}
                          onResume={resumeEpisode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Completed Episodes */}
                {completedEpisodes.length > 0 && (
                  <section>
                    <h2 className="text-lg font-medium mb-4 text-green-400 flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      Completed ({completedEpisodes.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {completedEpisodes.map((episode) => (
                        <EpisodeCard 
                          key={episode.id}
                          episode={episode} 
                          variant="compact"
                          onCreateMindMovie={() => handleCardCreateMindMovie(episode)}
                          onEditMindMovie={() => handleEditMindMovie(episode)}
                          onDelete={deleteEpisode}
                          onComplete={completeEpisode}
                          onPause={pauseEpisode}
                          onResume={resumeEpisode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Paused/Abandoned */}
                {otherEpisodes.length > 0 && (
                  <section>
                    <h2 className="text-lg font-medium mb-4 text-muted-foreground">
                      Other Episodes ({otherEpisodes.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {otherEpisodes.map((episode) => (
                        <EpisodeCard 
                          key={episode.id}
                          episode={episode} 
                          variant="compact"
                          onCreateMindMovie={() => handleCardCreateMindMovie(episode)}
                          onEditMindMovie={() => handleEditMindMovie(episode)}
                          onDelete={deleteEpisode}
                          onComplete={completeEpisode}
                          onPause={pauseEpisode}
                          onResume={resumeEpisode}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <EpisodeTimeline episodes={episodes} />
          </TabsContent>
           
           <TabsContent value="challenges" className="space-y-6">
             <div className="glass-card p-6 border border-border">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center">
                   <Target className="w-6 h-6 text-blue-500" />
                 </div>
                 <div>
                   <h2 className="text-xl font-display">Challenges & Adversity Training</h2>
                   <p className="text-sm text-muted-foreground">
                     Train your character through scenario-based emotional adversity
                   </p>
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   className="ml-auto"
                   onClick={() => navigate("/challenges")}
                 >
                   View All Challenges
                 </Button>
               </div>
               
               {loadingChallenges ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                 </div>
               ) : challenges.length === 0 ? (
                 <Card className="p-6 text-center">
                   <Target className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                   <p className="text-muted-foreground mb-4">No challenges yet</p>
                   <Button variant="gold" onClick={() => navigate("/challenges")}>
                     Generate Challenge
                   </Button>
                 </Card>
               ) : (
                 <ScrollArea className="h-[400px]">
                   <div className="space-y-3">
                     {challenges.slice(0, 5).map((challenge) => (
                       <ChallengeCard
                         key={challenge.id}
                         challenge={challenge}
                         onComplete={fetchChallenges}
                       />
                     ))}
                   </div>
                 </ScrollArea>
               )}
             </div>
           </TabsContent>
        </Tabs>
      </main>

      {/* Episode Wizard */}
      {showWizard && (
        <EpisodeWizard 
          onClose={() => setShowWizard(false)}
          onSuccess={handleWizardSuccess}
          onCreateMindMovie={handleCreateMindMovie}
        />
      )}

      {/* Episode Production Dashboard */}
      {showProductionDashboard && selectedEpisode && (
        <EpisodeProductionDashboard
          episode={selectedEpisode}
          onClose={() => {
            setShowProductionDashboard(false);
            setSelectedEpisode(null);
          }}
          onOpenMindMovieWizard={() => {
            setShowProductionDashboard(false);
            handleCardCreateMindMovie(selectedEpisode);
          }}
          chiefAim={chiefAim}
        />
      )}

      {/* Mind Movie Wizard for Episodes */}
      {movieWizardEpisode && (
        <MindMovieScriptWizard
          isOpen={!!movieWizardEpisode}
          onClose={() => {
            setMovieWizardEpisode(null);
            setCharacterAnalysis(null);
          }}
          chiefAim={chiefAim}
          episodeMode={true}
          movieId={movieWizardEpisode.mind_movie_script_id || undefined}
          episode={{
            id: movieWizardEpisode.id,
            title: movieWizardEpisode.title,
            objective: movieWizardEpisode.objective,
            deadline: movieWizardEpisode.deadline,
            alignment_score: movieWizardEpisode.alignment_score,
          }}
          transformationAnalysis={characterAnalysis ? {
            requiredCharacter: characterAnalysis.requiredCharacter,
            gap: characterAnalysis.transformationGap,
          } : undefined}
          onEpisodeMovieCreated={handleEpisodeMovieCreated}
        />
      )}
    </div>
  );
}
