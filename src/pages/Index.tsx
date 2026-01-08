import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ProductionStatus } from "@/components/dashboard/ProductionStatus";
import { DailyRitualChecklist } from "@/components/dashboard/DailyRitualChecklist";
import { DefiniteChiefAimCard } from "@/components/dashboard/DefiniteChiefAimCard";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { TheaterView } from "@/components/theater/TheaterView";
import { EditBay } from "@/components/studio/EditBay";
import { DirectorAIAgent } from "@/components/director-ai/DirectorAIAgent";
import { DailyScorecard } from "@/components/scorecard/DailyScorecard";
import { ChiefAimWizard } from "@/components/chief-aim/ChiefAimWizard";
import { MindMovieScriptWizard } from "@/components/mind-movie/MindMovieScriptWizard";
import { ThreeThings } from "@/components/tasks/ThreeThings";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGamification } from "@/hooks/useGamification";
import { Film, Loader2, Wand2, Sparkles, Bot, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showTheater, setShowTheater] = useState(false);
  const [showEditBay, setShowEditBay] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showChiefAimWizard, setShowChiefAimWizard] = useState(false);
  const [showMindMovieWizard, setShowMindMovieWizard] = useState(false);
  const [editBayInitialPrompt, setEditBayInitialPrompt] = useState<string | undefined>();

  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { refreshData, checkAndAwardBadges } = useGamification();

  const handleScorecardSuccess = useCallback(async () => {
    await refreshData();
    await checkAndAwardBadges();
  }, [refreshData, checkAndAwardBadges]);

  const handleSaveChiefAim = useCallback(async (aim: { what: string; byWhen: string; exchange: string; plan: string }) => {
    await updateProfile({
      chief_aim_what: aim.what,
      chief_aim_by_when: aim.byWhen,
      chief_aim_exchange: aim.exchange,
      chief_aim_plan: aim.plan,
    });
  }, [updateProfile]);
  // Default chief aim for demo/unauthenticated users
  const defaultChiefAim = {
    what: "Build a $10M annual revenue business that creates transformational impact for 100,000 people",
    byWhen: "December 31, 2026",
    exchange: "I will dedicate 4 focused hours daily to high-leverage activities, continuously develop my skills, and build strategic partnerships",
    plan: "Launch the Psycho-Cinematics program, build a community of 10,000 directors, and scale through strategic content and partnerships",
  };

  // Use profile data if available, otherwise use defaults
  const chiefAim = profile ? {
    what: profile.chief_aim_what || defaultChiefAim.what,
    byWhen: profile.chief_aim_by_when || defaultChiefAim.byWhen,
    exchange: profile.chief_aim_exchange || defaultChiefAim.exchange,
    plan: profile.chief_aim_plan || defaultChiefAim.plan,
  } : defaultChiefAim;

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
  const hasMindMovie = Boolean(profile?.mind_movie_url);
  const hasViewingHistory = (profile?.current_streak || 0) > 0;
  const hasCompletedTasks = (profile?.day_number || 0) > 1;
  const hasScorecard = (profile?.current_streak || 0) > 0;

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

  return (
    <div className="min-h-screen bg-background spotlight film-grain">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-4xl font-display tracking-wide mb-2">
              Welcome{user ? " Back" : ""}, <span className="text-gold-gradient">Director</span>
            </h2>
            <p className="text-muted-foreground">
              {user
                ? "The set is ready. Let's make today's scene count."
                : "Sign in to begin your transformation journey."}
            </p>
          </div>

          {!user ? (
            /* Unauthenticated State */
            <div className="glass-card p-12 cinematic-border text-center animate-slide-up">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-amber-soft/20 mx-auto mb-6 flex items-center justify-center">
                <Film className="w-10 h-10 text-gold" />
              </div>
              <h3 className="text-2xl font-display mb-4">Begin Your Director Journey</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Create your Mind Movie, track your daily rituals, and transform your identity with the Psycho-Cinematics™ framework.
              </p>
              <Button variant="gold" size="lg" onClick={() => setShowAuthModal(true)}>
                Enter the Studio
              </Button>
            </div>
          ) : (
            <>
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

              {/* Mind Movie Script Writer Card */}
              {chiefAimComplete && (
                <button
                  onClick={() => setShowMindMovieWizard(true)}
                  className="w-full glass-card p-6 cinematic-border animate-slide-up group hover:border-amber-500/50 transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-600/30 transition-all duration-300">
                      <Clapperboard className="w-7 h-7 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-display tracking-wide group-hover:text-amber-500 transition-colors">Mind Movie Script Writer</h3>
                        <Sparkles className="w-4 h-4 text-amber-500/60" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        AI-powered storyboard generator — Create scene-by-scene prompts from your Chief Aim.
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground group-hover:text-amber-500 transition-colors">
                      <span>Create Storyboard</span>
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </button>
              )}

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
            </>
          )}
        </div>
      </main>

      {/* Theater View */}
      {showTheater && user && (
        <TheaterView onClose={() => setShowTheater(false)} />
      )}

      {/* Edit Bay */}
      {showEditBay && user && (
        <EditBay 
          onClose={() => {
            setShowEditBay(false);
            setEditBayInitialPrompt(undefined);
          }}
          initialPrompt={editBayInitialPrompt}
        />
      )}

      {/* Scorecard */}
      {showScorecard && user && (
        <DailyScorecard 
          onClose={() => setShowScorecard(false)} 
          onSubmitSuccess={handleScorecardSuccess}
        />
      )}

      {/* Mind Movie Script Wizard */}
      {showMindMovieWizard && user && (
        <MindMovieScriptWizard
          isOpen={showMindMovieWizard}
          onClose={() => setShowMindMovieWizard(false)}
          chiefAim={chiefAim}
          onOpenEditBay={(prompt) => {
            setEditBayInitialPrompt(prompt);
            setShowEditBay(true);
            setShowMindMovieWizard(false);
          }}
        />
      )}

      {/* Chief Aim Wizard */}
      {showChiefAimWizard && user && (
        <ChiefAimWizard
          isOpen={showChiefAimWizard}
          onClose={() => setShowChiefAimWizard(false)}
          initialAim={chiefAim}
          onSave={handleSaveChiefAim}
        />
      )}

      {/* Director AI Agent */}
      {user && (
        <>
          {/* AI Agent Trigger Button */}
          {!showAIChat && (
            <button
              onClick={() => setShowAIChat(true)}
              className="fixed bottom-6 right-6 z-40 flex items-center gap-3 group"
            >
              {/* Label */}
              <div className="bg-card/95 backdrop-blur-sm border border-border px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">Talk to Director AI</span>
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
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
