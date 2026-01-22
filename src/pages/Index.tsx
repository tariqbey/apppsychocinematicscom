import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { LandingPage } from "@/components/landing/LandingPage";
import { ProductionStatus } from "@/components/dashboard/ProductionStatus";
import { DailyRitualChecklist } from "@/components/dashboard/DailyRitualChecklist";
import { DefiniteChiefAimCard } from "@/components/dashboard/DefiniteChiefAimCard";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { CutResetModal } from "@/components/dashboard/CutResetModal";
import { TheaterView } from "@/components/theater/TheaterView";
import { EditBay } from "@/components/studio/EditBay";
import { DirectorAIAgent } from "@/components/director-ai/DirectorAIAgent";
import { DailyScorecard } from "@/components/scorecard/DailyScorecard";
import { ChiefAimWizard } from "@/components/chief-aim/ChiefAimWizard";
import { MindMovieScriptWizard, TimelineExportData } from "@/components/mind-movie/MindMovieScriptWizard";
import { MovieVault } from "@/components/mind-movie/MovieVault";
import { DirectorsJournal } from "@/components/journal/DirectorsJournal";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingModal, useOnboarding } from "@/components/onboarding/OnboardingModal";
import { ActiveEpisodeBanner } from "@/components/episodes/ActiveEpisodeBanner";
import { EpisodeWizard } from "@/components/episodes/EpisodeWizard";
import { EpisodeCharacterDashboard } from "@/components/dashboard/EpisodeCharacterDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGamification } from "@/hooks/useGamification";
import { useMindMovies, MindMovie } from "@/hooks/useMindMovies";
import { useEpisodes } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Bot, Clapperboard, Zap, MessageSquareHeart, FileText, Wand2, FolderOpen, BookOpen, Target, User2, Music, XCircle, Flame } from "lucide-react";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";
import { DirectorRadioCard } from "@/components/radio/DirectorRadioCard";
import { TestimonialSubmissionDialog } from "@/components/testimonials/TestimonialSubmissionDialog";
import { EnableNotificationsBanner } from "@/components/notifications/EnableNotificationsBanner";
import { DirectorBanner } from "@/components/dashboard/DirectorBanner";

// Custom module icons
import iconChiefAim from "@/assets/icons/icon-chief-aim.png";
import iconCharacter from "@/assets/icons/icon-character.png";
import iconMindMovie from "@/assets/icons/icon-mind-movie.png";
import iconEditBay from "@/assets/icons/icon-edit-bay.png";
import iconJournal from "@/assets/icons/icon-journal.png";
import iconActions from "@/assets/icons/icon-actions.png";
import iconSoundtrack from "@/assets/icons/icon-soundtrack.png";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTheater, setShowTheater] = useState(false);
  const [showEditBay, setShowEditBay] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showChiefAimWizard, setShowChiefAimWizard] = useState(false);
  const [showMindMovieWizard, setShowMindMovieWizard] = useState(false);
  const [showMovieVault, setShowMovieVault] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | undefined>();
  const [editBayInitialPrompt, setEditBayInitialPrompt] = useState<string | undefined>();
  const [editBaySceneContext, setEditBaySceneContext] = useState<{
    sceneOrder: number;
    sceneTitle: string;
    movieId?: string;
  } | undefined>();
  const [timelineExportData, setTimelineExportData] = useState<TimelineExportData | undefined>();
  const [showJournal, setShowJournal] = useState(false);
  const [showCutReset, setShowCutReset] = useState(false);
  const [transformationDataForWizard, setTransformationDataForWizard] = useState<{
    analysis: unknown;
    chiefAim: { what: string | null; byWhen: string | null; exchange: string | null; plan: string | null };
  } | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { refreshData, checkAndAwardBadges } = useGamification();
  const { showOnboarding, completeOnboarding, closeOnboarding } = useOnboarding(user?.id);
  const { createNewMovie } = useMindMovies();
  const { activeEpisode, loading: episodesLoading, updateEpisode } = useEpisodes();
  const [showEpisodeWizard, setShowEpisodeWizard] = useState(false);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [episodeForMovie, setEpisodeForMovie] = useState<{
    id: string;
    title: string;
    objective: string;
    deadline: string;
    alignment_score?: number | null;
  } | null>(null);

  const handleCreateNewMovie = useCallback(async () => {
    const movie = await createNewMovie();
    if (movie) {
      setSelectedMovieId(movie.id);
      setShowMovieVault(false);
      setShowMindMovieWizard(true);
    }
  }, [createNewMovie]);

  const handleSelectMovie = useCallback((movie: MindMovie) => {
    setSelectedMovieId(movie.id);
    setShowMovieVault(false);
    setShowMindMovieWizard(true);
  }, []);

  const handleScorecardSuccess = useCallback(async () => {
    await refreshData();
    await checkAndAwardBadges();
  }, [refreshData, checkAndAwardBadges]);

  const handleAddToTimeline = useCallback((data: TimelineExportData) => {
    setTimelineExportData(data);
    setShowMindMovieWizard(false);
    setEpisodeForMovie(null);
    setShowEditBay(true);
  }, []);

  // Handler for creating episode mini movies
  const handleCreateEpisodeMovie = useCallback(async () => {
    if (!activeEpisode) return;
    
    const movie = await createNewMovie();
    if (movie) {
      setEpisodeForMovie({
        id: activeEpisode.id,
        title: activeEpisode.title,
        objective: activeEpisode.objective,
        deadline: activeEpisode.deadline,
        alignment_score: activeEpisode.alignment_score,
      });
      setSelectedMovieId(movie.id);
      setShowMovieVault(false);
      setShowMindMovieWizard(true);
    }
  }, [activeEpisode, createNewMovie]);

  // Handler for linking episode movie to episode
  const handleEpisodeMovieCreated = useCallback(async (scriptId: string) => {
    if (!episodeForMovie) return;
    
    await updateEpisode(episodeForMovie.id, {
      mind_movie_script_id: scriptId,
    });
    setEpisodeForMovie(null);
  }, [episodeForMovie, updateEpisode]);

  const handleSaveChiefAim = useCallback(async (aim: { what: string; byWhen: string; exchange: string; plan: string }) => {
    await updateProfile({
      chief_aim_what: aim.what,
      chief_aim_by_when: aim.byWhen,
      chief_aim_exchange: aim.exchange,
      chief_aim_plan: aim.plan,
    });
  }, [updateProfile]);

  // Use profile data - empty values for new users
  const chiefAim = {
    what: profile?.chief_aim_what || "",
    byWhen: profile?.chief_aim_by_when || "",
    exchange: profile?.chief_aim_exchange || "",
    plan: profile?.chief_aim_plan || "",
  };

  const currentAct = profile?.current_act || "Act I: The Director Emerges";
  const dayNumber = profile?.day_number || 1;
  const streak = profile?.current_streak || 0;
  const bestStreak = profile?.best_streak || 0;

  // Phase progress checks
  const chiefAimComplete = Boolean(
    profile?.chief_aim_what && 
    profile?.chief_aim_by_when && 
    profile?.chief_aim_exchange && 
    profile?.chief_aim_plan
  );

  // Check for openWizard URL parameter (from Character Builder)
  useEffect(() => {
    const openWizardFromCharacter = async () => {
      if (searchParams.get("openWizard") !== "true") return;

      // Wait until auth has fully resolved.
      if (authLoading) return;

      // If the user isn't signed in, the landing page will render; still show a helpful message.
      if (!user) {
        toast.error("Please sign in to create your transformation script.");
        return;
      }

      // Pull transformation payload from sessionStorage (set by CharacterTransformationCoach).
      const storedAnalysis = sessionStorage.getItem("transformationAnalysis");
      const storedChiefAim = sessionStorage.getItem("chiefAimForScript");

      if (!storedAnalysis || !storedChiefAim) {
        // Clear the URL param so we don't keep retrying on every render.
        setSearchParams({});
        toast.error("Couldn't find your transformation data. Go back to Character → Transform and click the button again.");
        return;
      }

      let transformationData: { analysis: unknown; chiefAim: { what: string | null; byWhen: string | null; exchange: string | null; plan: string | null } } | null = null;
      try {
        const analysis = JSON.parse(storedAnalysis);
        const chiefAimData = JSON.parse(storedChiefAim);
        transformationData = { analysis, chiefAim: chiefAimData };
      } catch (e) {
        console.error("Failed to parse transformation data:", e);
        setSearchParams({});
        toast.error("Your transformation data was corrupted. Please click the button again.");
        return;
      }

      // Clear session storage once we've successfully parsed it.
      sessionStorage.removeItem("transformationAnalysis");
      sessionStorage.removeItem("chiefAimForScript");

      // Clear the URL parameter so refreshes don't keep re-opening.
      setSearchParams({});

      // Set transformation data BEFORE creating movie.
      setTransformationDataForWizard(transformationData);

      try {
        const movie = await createNewMovie();
        if (movie) {
          setSelectedMovieId(movie.id);
          setShowMovieVault(false);
          setShowMindMovieWizard(true);
          toast.success("Mind Movie Wizard opened with your transformation data!");
        } else {
          toast.error("Failed to create Mind Movie. Please try again from the Movie Vault.");
        }
      } catch (error) {
        console.error("Error creating movie from transformation:", error);
        toast.error("An error occurred. Please try again.");
      }
    };

    openWizardFromCharacter();
  }, [searchParams, user, authLoading, setSearchParams, createNewMovie]);

  // Check for openJournal URL parameter (from Challenges page)
  useEffect(() => {
    if (searchParams.get("openJournal") !== "true") return;
    if (authLoading) return;
    if (!user) return;

    // Clear the URL param and open journal
    setSearchParams({});
    setShowJournal(true);

    // Check for challenge context in sessionStorage
    const challengeContext = sessionStorage.getItem("adversityChallengeForJournal");
    if (challengeContext) {
      try {
        const context = JSON.parse(challengeContext);
        toast.info(`Reflecting on: ${context.trait} challenge`);
      } catch {
        // Ignore parsing errors
      }
    }
  }, [searchParams, user, authLoading, setSearchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading the studio...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage onLogin={() => setShowAuthModal(true)} />;
  }

  return (
    <div className="min-h-screen bg-background spotlight film-grain overflow-x-hidden w-full max-w-[100vw]">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-28 sm:pb-32 overflow-x-hidden w-full">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Director Banner - Futuristic cover art + profile picture */}
          <DirectorBanner 
            onOpenAIStudio={() => {
              setEditBayInitialPrompt(undefined);
              setEditBaySceneContext(undefined);
              setShowEditBay(true);
            }}
            className="animate-fade-in"
          />

          {/* Push Notifications Banner - Reminds users to enable */}
          <EnableNotificationsBanner className="animate-slide-up" />

          {/* Production Status */}
          <ProductionStatus currentAct={currentAct} dayNumber={dayNumber} />

          {/* Definite Chief Aim Creator Card - THE FOUNDATION - Must be done first */}
          <button
            onClick={() => setShowChiefAimWizard(true)}
            className={`w-full glass-card p-6 cinematic-border animate-slide-up group transition-all duration-300 text-left ${
              chiefAimComplete 
                ? "hover:border-emerald-500/50" 
                : "border-gold/50 hover:border-gold ring-2 ring-gold/20"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden ${
                chiefAimComplete 
                  ? "bg-gradient-to-br from-emerald-500/20 to-green-600/20 group-hover:from-emerald-500/30 group-hover:to-green-600/30" 
                  : "bg-gradient-to-br from-gold/30 to-amber-500/30 animate-pulse"
              }`}>
                <img src={iconChiefAim} alt="" className="w-10 h-10 object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-xl font-display tracking-wide transition-colors ${
                    chiefAimComplete ? "group-hover:text-emerald-400" : "text-gold group-hover:text-gold"
                  }`}>
                    {chiefAimComplete ? "Definite Chief Aim" : "⭐ Start Here: Definite Chief Aim"}
                  </h3>
                  <Sparkles className={`w-4 h-4 ${chiefAimComplete ? "text-emerald-400/60" : "text-gold/60"}`} />
                  <InfoTooltip content="Your Definite Chief Aim is THE FOUNDATION of everything. It's a crystal-clear statement of your burning desire, deadline, exchange, and plan. This becomes the script for your entire transformation journey." />
                </div>
                <p className="text-sm text-muted-foreground">
                  {chiefAimComplete 
                    ? "Your transformation script is set • Click to refine or update" 
                    : "The foundation of your transformation • AI-guided script writing"}
                </p>
              </div>
              <div className={`hidden sm:flex items-center gap-2 text-sm transition-colors ${
                chiefAimComplete 
                  ? "text-muted-foreground group-hover:text-emerald-400" 
                  : "text-gold group-hover:text-gold font-semibold"
              }`}>
                <span>{chiefAimComplete ? "Edit Script" : "Create Now"}</span>
                <span className="text-lg">→</span>
              </div>
            </div>
          </button>

          {/* Streak Banner */}
          <StreakBanner streak={streak} bestStreak={bestStreak} />

          {/* CUT! Button - Big red reset button */}
          <button
            onClick={() => setShowCutReset(true)}
            className="w-full glass-card p-5 animate-slide-up group transition-all duration-300 text-left border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-display tracking-wider text-red-500 group-hover:text-red-400 transition-colors font-bold">
                  CUT!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Reset your mindset • Watch your Mind Movie • Get back in character
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-red-500 group-hover:text-red-400 transition-colors font-semibold">
                <span>Reset Now</span>
                <span className="text-lg">→</span>
              </div>
            </div>
          </button>

          {/* Active Episode Banner - Clickable to navigate to Episodes page */}
          {activeEpisode && (
            <ActiveEpisodeBanner 
              episode={activeEpisode} 
              clickToNavigate={true}
            />
          )}

          {/* Episode Character Dashboard - Shows transformation profile for active episode */}
          {activeEpisode?.character_transformation && (
            <EpisodeCharacterDashboard episode={activeEpisode} />
          )}

          {/* Resume Production Button - When active episode has a Mind Movie in progress */}
          {activeEpisode?.mind_movie_script_id && activeEpisode.status !== "completed" && (
            <button
              onClick={() => {
                setSelectedMovieId(activeEpisode.mind_movie_script_id!);
                setEpisodeForMovie({
                  id: activeEpisode.id,
                  title: activeEpisode.title,
                  objective: activeEpisode.objective,
                  deadline: activeEpisode.deadline,
                  alignment_score: activeEpisode.alignment_score,
                });
                setShowMindMovieWizard(true);
              }}
              className="w-full glass-card p-4 cinematic-border animate-slide-up group hover:border-green-500/50 transition-all duration-300 text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center animate-pulse">
                <Clapperboard className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium group-hover:text-green-500 transition-colors">Resume Production</h3>
                <p className="text-sm text-muted-foreground">Continue editing "{activeEpisode.title}" Mind Movie</p>
              </div>
              <span className="text-green-500 hidden sm:block">Continue →</span>
            </button>
          )}

          {/* New Episode Button (when no active episode) */}
          {!activeEpisode && !episodesLoading && chiefAimComplete && (
            <button
              onClick={() => setShowEpisodeWizard(true)}
              className="w-full glass-card p-4 cinematic-border animate-slide-up group hover:border-amber-500/50 transition-all duration-300 text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium group-hover:text-amber-500 transition-colors">Start a New Episode</h3>
                <p className="text-sm text-muted-foreground">Short-term sprint aligned with your Chief Aim</p>
              </div>
              <span className="text-amber-500 hidden sm:block">+ Create</span>
            </button>
          )}

          {/* ========== STEP 2: CHARACTER BUILDER ========== */}
          <ModuleCard
            onClick={() => navigate("/character")}
            iconImage={iconCharacter}
            icon={null}
            title="Character Builder"
            description="Discover your archetype • Daily trait scorecard • Transformation tracking"
            actionText="Build Character"
            colorScheme="cyan"
            tooltip="Discover your Director archetype, define required character traits, and track daily alignment. Build the identity needed to achieve your Chief Aim."
            animationIndex={0}
          />

          {/* ========== STEP 3: MIND MOVIE VAULT ========== */}
          <div className="flex flex-col sm:flex-row gap-4">
            <ModuleCard
              onClick={() => setShowMovieVault(true)}
              iconImage={iconMindMovie}
              icon={null}
              title="Mind Movie Vault"
              description="Manage multiple Mind Movies — One for each goal or scenario."
              actionText="Open Vault"
              colorScheme="amber"
              tooltip="Create and manage multiple Mind Movies for different goals and scenarios. Each movie has its own Chief Aim snapshot, storyboard, and soundtrack."
              className="flex-1"
              animationIndex={1}
            />

            {/* Quick Create New Movie Button */}
            {chiefAimComplete && (
              <Button
                variant="gold"
                onClick={handleCreateNewMovie}
                className="sm:w-auto h-auto py-4 px-6"
              >
                <Clapperboard className="w-5 h-5 mr-2" />
                Start New Movie
              </Button>
            )}
          </div>

          {/* ========== STEP 4: EDIT BAY (AI STUDIO) ========== */}
          <ModuleCard
            onClick={() => {
              setEditBayInitialPrompt(undefined);
              setEditBaySceneContext(undefined);
              setShowEditBay(true);
            }}
            iconImage={iconEditBay}
            icon={null}
            title="The Edit Bay"
            description="AI Media Generation Studio — Create images, animate them into videos, and build your Mind Movie."
            actionText="Enter Studio"
            colorScheme="gold"
            tooltip="Generate AI images of your future self and goals, then animate them into videos. Use reference photos of yourself to see YOU living your Chief Aim. Great for creating Mind Movie visuals."
            animationIndex={2}
          />

          {/* ========== CHALLENGES & ADVERSITY ========== */}
          <ModuleCard
            onClick={() => navigate("/challenges")}
            icon={<Target className="w-7 h-7 text-red-500" />}
            title="Challenges & Adversity"
            description="Character training • XP rewards • Transformation tracking"
            actionText="Train Now"
            colorScheme="red"
            tooltip="Train your character through scenario-based emotional adversity. Earn XP by responding transformatively to challenges."
            animationIndex={3}
          />

          {/* ========== STEP 5: ACTION EXECUTION ========== */}
          <ModuleCard
            onClick={() => navigate("/actions")}
            iconImage={iconActions}
            icon={null}
            title="Action Execution"
            description="Your 3 daily priorities • Excuse tracking • Accountability analytics"
            actionText="Open Actions"
            colorScheme="primary"
            tooltip="Focus on just 3 priority tasks per day that move you toward your Chief Aim. Track your excuse patterns and build accountability."
            animationIndex={4}
          />

          {/* ========== STEP 6: DIRECTOR'S JOURNAL ========== */}
          <ModuleCard
            onClick={() => setShowJournal(true)}
            iconImage={iconJournal}
            icon={null}
            title="Director's Journal"
            description="Record your journey • AI insights & accountability tracking"
            actionText="Open Journal"
            colorScheme="purple"
            tooltip="Record your experiences, breakthroughs, and challenges. Get AI-powered feedback on your progress and accountability reports to track your transformation journey."
            animationIndex={5}
          />

          {/* ========== STEP 7: SOUNDTRACK STUDIO ========== */}
          <ModuleCard
            onClick={() => navigate("/soundtrack")}
            iconImage={iconSoundtrack}
            icon={null}
            title="Soundtrack Studio"
            description="Create custom AI soundtracks • 50+ music genres • Save to library"
            actionText="Create Music"
            colorScheme="pink"
            tooltip="Create AI-generated music and lyrics for your Mind Movies. Choose from 50+ genres and styles to match your vision."
            animationIndex={6}
          />

          {/* ========== STEP 8: THE SCORE (Personal Music) ========== */}
          <ModuleCard
            onClick={() => navigate("/score")}
            icon={<Music className="w-7 h-7 text-gold" />}
            title="The Score"
            description="Your personal music library • Create playlists • Stream your tracks anywhere"
            actionText="Open Score"
            colorScheme="gold"
            tooltip="Your personal music player. Organize tracks into playlists, drag to reorder, and stream your transformation soundtrack."
            animationIndex={7}
          />

          {/* ========== STEP 9: DIRECTOR RADIO ========== */}
          <DirectorRadioCard />

          {/* ========== BONUS: SHARE YOUR STORY ========== */}
          <ModuleCard
            onClick={() => setShowTestimonialDialog(true)}
            icon={<MessageSquareHeart className="w-7 h-7 text-emerald-400" />}
            title="Share Your Story"
            description="Record a testimonial • Inspire other directors • Get featured on the landing page"
            actionText="Share"
            colorScheme="emerald"
            animationIndex={8}
          />

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Ritual */}
            <DailyRitualChecklist
              onTheaterClick={() => setShowTheater(true)}
              onScorecardClick={() => setShowScorecard(true)}
              onEveningMindMovieClick={() => {
                // Evening flow: Show theater first, scorecard will be shown after
                setShowTheater(true);
              }}
            />

            {/* Chief Aim */}
            <DefiniteChiefAimCard aim={chiefAim} onEdit={() => setShowChiefAimWizard(true)} />
          </div>
        </div>
      </main>

      {/* CUT Reset Modal */}
      <CutResetModal
        isOpen={showCutReset}
        onClose={() => setShowCutReset(false)}
        onWatchMindMovie={() => {
          setShowCutReset(false);
          setShowTheater(true);
        }}
        chiefAim={chiefAim}
      />

      {/* Theater View */}
      {showTheater && (
        <TheaterView onClose={() => setShowTheater(false)} />
      )}

      {/* Edit Bay */}
      {showEditBay && (
        <EditBay 
          onClose={() => {
            setShowEditBay(false);
            setEditBayInitialPrompt(undefined);
            setEditBaySceneContext(undefined);
            setTimelineExportData(undefined);
          }}
          initialPrompt={editBayInitialPrompt}
          timelineImportData={timelineExportData}
          sceneContext={editBaySceneContext ? {
            sceneOrder: editBaySceneContext.sceneOrder,
            sceneTitle: editBaySceneContext.sceneTitle,
            onImageSaved: async (imageUrl: string, sceneOrder: number) => {
              // Update the scene in the database
              if (editBaySceneContext.movieId) {
                try {
                  const { data: scriptData } = await supabase
                    .from("mind_movie_scripts")
                    .select("scenes")
                    .eq("id", editBaySceneContext.movieId)
                    .single();
                  
                  if (scriptData?.scenes && Array.isArray(scriptData.scenes)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const scenes = scriptData.scenes as any[];
                    const updatedScenes = scenes.map((scene: any) => 
                      scene.order === sceneOrder 
                        ? { ...scene, generatedImageUrl: imageUrl }
                        : scene
                    );
                    
                    await supabase
                      .from("mind_movie_scripts")
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      .update({ scenes: updatedScenes as any })
                      .eq("id", editBaySceneContext.movieId);
                    
                    toast.success(`Image saved to Scene ${sceneOrder}!`);
                    
                    // Reopen the wizard with the updated movie
                    setShowEditBay(false);
                    setEditBaySceneContext(undefined);
                    setEditBayInitialPrompt(undefined);
                    setSelectedMovieId(editBaySceneContext.movieId);
                    setShowMindMovieWizard(true);
                  }
                } catch (error) {
                  console.error("Error saving scene image:", error);
                  toast.error("Failed to save image to scene");
                }
              }
            },
          } : undefined}
        />
      )}

      {/* Scorecard */}
      {showScorecard && (
        <DailyScorecard 
          onClose={() => setShowScorecard(false)} 
          onSubmitSuccess={handleScorecardSuccess}
        />
      )}

      {/* Movie Vault */}
      <MovieVault
        isOpen={showMovieVault}
        onClose={() => setShowMovieVault(false)}
        onSelectMovie={handleSelectMovie}
        onCreateNew={handleCreateNewMovie}
      />

      {/* Mind Movie Script Wizard */}
      {showMindMovieWizard && (
        <MindMovieScriptWizard
          isOpen={showMindMovieWizard}
          onClose={() => {
            setShowMindMovieWizard(false);
            setSelectedMovieId(undefined);
            setTransformationDataForWizard(null);
            setEpisodeForMovie(null);
          }}
          chiefAim={transformationDataForWizard?.chiefAim ? {
            what: transformationDataForWizard.chiefAim.what || "",
            byWhen: transformationDataForWizard.chiefAim.byWhen || "",
            exchange: transformationDataForWizard.chiefAim.exchange || "",
            plan: transformationDataForWizard.chiefAim.plan || "",
          } : chiefAim}
          movieId={selectedMovieId}
          onOpenEditBay={(prompt, sceneContext) => {
            setEditBayInitialPrompt(prompt);
            setEditBaySceneContext(sceneContext ? {
              ...sceneContext,
              movieId: selectedMovieId,
            } : undefined);
            setShowEditBay(true);
            setShowMindMovieWizard(false);
            setEpisodeForMovie(null);
          }}
          onAddToTimeline={handleAddToTimeline}
          transformationAnalysis={transformationDataForWizard?.analysis}
          episodeMode={!!episodeForMovie}
          episode={episodeForMovie || undefined}
          onEpisodeMovieCreated={handleEpisodeMovieCreated}
        />
      )}

      {/* Chief Aim Wizard */}
      {showChiefAimWizard && (
        <ChiefAimWizard
          isOpen={showChiefAimWizard}
          onClose={() => setShowChiefAimWizard(false)}
          initialAim={chiefAim}
          onSave={handleSaveChiefAim}
        />
      )}

      {/* Director AI Agent */}
      <>
        {/* AI Agent Trigger Button - Always show label */}
        {!showAIChat && (
          <button
            onClick={() => setShowAIChat(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 group"
          >
            {/* Permanent Label */}
            <div className="bg-card/95 backdrop-blur-sm border border-gold/30 px-4 py-2 rounded-lg shadow-lg">
              <span className="text-sm font-semibold text-gold whitespace-nowrap">Director AI</span>
              <p className="text-xs text-muted-foreground">Your AI Coach</p>
            </div>
            
            {/* Animated Orb Button */}
            <div className="relative">
              {/* Outer glow rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/40 to-amber-600/40 blur-xl animate-pulse" />
              <div className="absolute -inset-2 rounded-full border border-gold/20 animate-[spin_8s_linear_infinite]" />
              <div className="absolute -inset-4 rounded-full border border-gold/10 animate-[spin_12s_linear_infinite_reverse]" />
              
              {/* Main button */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gold via-amber-500 to-amber-600 shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(212,175,55,0.7)]">
                {/* Inner highlight */}
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
                
                {/* Icon */}
                <Bot className="w-7 h-7 text-black relative z-10 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </button>
        )}
        
        <DirectorAIAgent
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          chiefAim={chiefAim}
          userId={user.id}
        />
      </>

      {/* Director's Journal */}
      <DirectorsJournal
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* First-time User Onboarding */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Episode Wizard */}
      {showEpisodeWizard && (
        <EpisodeWizard onClose={() => setShowEpisodeWizard(false)} />
      )}

      {/* Testimonial Submission Dialog */}
      <TestimonialSubmissionDialog
        open={showTestimonialDialog}
        onOpenChange={setShowTestimonialDialog}
      />
    </div>
  );
};

export default Index;
