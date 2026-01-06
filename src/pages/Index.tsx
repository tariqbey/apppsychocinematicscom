import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ProductionStatus } from "@/components/dashboard/ProductionStatus";
import { DailyRitualChecklist } from "@/components/dashboard/DailyRitualChecklist";
import { DefiniteChiefAimCard } from "@/components/dashboard/DefiniteChiefAimCard";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { TheaterView } from "@/components/theater/TheaterView";
import { DirectorAIChat } from "@/components/director-ai/DirectorAIChat";
import { DailyScorecard } from "@/components/scorecard/DailyScorecard";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGamification } from "@/hooks/useGamification";
import { Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showTheater, setShowTheater] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { refreshData, checkAndAwardBadges } = useGamification();

  const handleScorecardSuccess = useCallback(async () => {
    await refreshData();
    await checkAndAwardBadges();
  }, [refreshData, checkAndAwardBadges]);

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

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Daily Ritual */}
                <DailyRitualChecklist
                  onTheaterClick={() => setShowTheater(true)}
                  onScorecardClick={() => setShowScorecard(true)}
                />

                {/* Chief Aim */}
                <DefiniteChiefAimCard aim={chiefAim} />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Theater View */}
      {showTheater && user && (
        <TheaterView onClose={() => setShowTheater(false)} />
      )}

      {/* Scorecard */}
      {showScorecard && user && (
        <DailyScorecard 
          onClose={() => setShowScorecard(false)} 
          onSubmitSuccess={handleScorecardSuccess}
        />
      )}

      {/* Director AI Chat */}
      {user && (
        <DirectorAIChat
          isOpen={showAIChat}
          onToggle={() => setShowAIChat(!showAIChat)}
          chiefAim={chiefAim.what}
        />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
