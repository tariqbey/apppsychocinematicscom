import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { LandingPage } from "@/components/landing/LandingPage";
import { ProductionStatus } from "@/components/dashboard/ProductionStatus";
import { DailyRitualChecklist } from "@/components/dashboard/DailyRitualChecklist";
import { DefiniteChiefAimCard } from "@/components/dashboard/DefiniteChiefAimCard";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { TheaterView } from "@/components/theater/TheaterView";
import { EditBay } from "@/components/studio/EditBay";
import { DirectorAIAgent } from "@/components/director-ai/DirectorAIAgent";
import { DailyScorecard } from "@/components/scorecard/DailyScorecard";
import { ChiefAimWizard } from "@/components/chief-aim/ChiefAimWizard";
import { MindMovieScriptWizard, TimelineExportData } from "@/components/mind-movie/MindMovieScriptWizard";
import { MovieVault } from "@/components/mind-movie/MovieVault";
import { ThreeThings } from "@/components/tasks/ThreeThings";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingModal, useOnboarding } from "@/components/onboarding/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGamification } from "@/hooks/useGamification";
import { useMindMovies, MindMovie } from "@/hooks/useMindMovies";
import { Film, Loader2, Wand2, Sparkles, Bot, Clapperboard, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const Index = () => {
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
  const [timelineExportData, setTimelineExportData] = useState<TimelineExportData | undefined>();

  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { refreshData, checkAndAwardBadges } = useGamification();
  const { showOnboarding, completeOnboarding, closeOnboarding } = useOnboarding(user?.id);
  const { createNewMovie } = useMindMovies();

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
    setShowEditBay(true);
  }, []);

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
    <div className="min-h-screen bg-background spotlight film-grain">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-4xl font-display tracking-wide mb-2">
              Welcome Back, <span className="text-gold-gradient">Director</span>
            </h2>
            <p className="text-muted-foreground">
              The set is ready. Let's make today's scene count.
            </p>
          </div>

          {/* Production Status */}
          <ProductionStatus currentAct={currentAct} dayNumber={dayNumber} />

          {/* Streak Banner */}
          <StreakBanner streak={streak} bestStreak={bestStreak} />

          {/* Edit Bay Card */}
          <button
            onClick={() => {
              setEditBayInitialPrompt(undefined);
              setShowEditBay(true);
            }}
            className="w-full glass-card p-6 cinematic-border animate-slide-up group hover:border-gold/50 transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-amber-soft/20 flex items-center justify-center group-hover:from-gold/30 group-hover:to-amber-soft/30 transition-all duration-300">
                <Wand2 className="w-7 h-7 text-gold" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-display tracking-wide group-hover:text-gold transition-colors">The Edit Bay</h3>
                  <Sparkles className="w-4 h-4 text-gold/60" />
                  <InfoTooltip content="Generate AI images of your future self and goals, then animate them into videos. Use reference photos of yourself to see YOU living your Chief Aim. Great for creating Mind Movie visuals." />
                </div>
                <p className="text-sm text-muted-foreground">
                  AI Media Generation Studio — Create images, animate them into videos, and build your Mind Movie.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground group-hover:text-gold transition-colors">
                <span>Enter Studio</span>
                <span className="text-lg">→</span>
              </div>
            </div>
          </button>

          {/* Mind Movie Vault Card */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowMovieVault(true)}
              className="flex-1 glass-card p-6 cinematic-border animate-slide-up group hover:border-amber-500/50 transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-600/30 transition-all duration-300">
                  <FolderOpen className="w-7 h-7 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-display tracking-wide group-hover:text-amber-500 transition-colors">Mind Movie Vault</h3>
                    <Sparkles className="w-4 h-4 text-amber-500/60" />
                    <InfoTooltip content="Create and manage multiple Mind Movies for different goals and scenarios. Each movie has its own Chief Aim snapshot, storyboard, and soundtrack." />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage multiple Mind Movies — One for each goal or scenario.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <span>Open Vault</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </button>

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

          {/* Three Things - Daily Task Manager */}
          <ThreeThings />

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Ritual */}
            <DailyRitualChecklist
              onTheaterClick={() => setShowTheater(true)}
              onScorecardClick={() => setShowScorecard(true)}
            />

            {/* Chief Aim */}
            <DefiniteChiefAimCard aim={chiefAim} onEdit={() => setShowChiefAimWizard(true)} />
          </div>
        </div>
      </main>

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
            setTimelineExportData(undefined);
          }}
          initialPrompt={editBayInitialPrompt}
          timelineImportData={timelineExportData}
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
          }}
          chiefAim={chiefAim}
          movieId={selectedMovieId}
          onOpenEditBay={(prompt) => {
            setEditBayInitialPrompt(prompt);
            setShowEditBay(true);
            setShowMindMovieWizard(false);
          }}
          onAddToTimeline={handleAddToTimeline}
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

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* First-time User Onboarding */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

export default Index;
