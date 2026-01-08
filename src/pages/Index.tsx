import { useState, useCallback, useEffect } from "react";
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
import { ThreeThings } from "@/components/tasks/ThreeThings";
import { AuthModal } from "@/components/auth/AuthModal";
import Landing from "@/pages/Landing";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGamification } from "@/hooks/useGamification";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2, Wand2, Sparkles, Bot, CreditCard, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showTheater, setShowTheater] = useState(false);
  const [showEditBay, setShowEditBay] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showChiefAimWizard, setShowChiefAimWizard] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { refreshData, checkAndAwardBadges } = useGamification();
  const { 
    subscription, 
    loading: subscriptionLoading, 
    checkoutLoading, 
    portalLoading,
    startCheckout, 
    openCustomerPortal,
    checkSubscription 
  } = useSubscription();
  const { toast } = useToast();

  // Check for subscription success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionStatus = params.get('subscription');
    
    if (subscriptionStatus === 'success') {
      toast({
        title: "Welcome to Director's OS!",
        description: subscription.isTrialing 
          ? "Your 7-day free trial has started. Enjoy full access!" 
          : "Your subscription is now active. Let's create!",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/');
      // Refresh subscription status
      checkSubscription();
    } else if (subscriptionStatus === 'canceled') {
      toast({
        variant: "destructive",
        title: "Checkout Canceled",
        description: "No worries! You can subscribe anytime.",
      });
      window.history.replaceState({}, '', '/');
    }
  }, [toast, checkSubscription, subscription.isTrialing]);

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

  // Show landing page for unauthenticated users
  if (!user && !authLoading) {
    return (
      <>
        <Landing onOpenAuth={() => setShowAuthModal(true)} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading the studio...</p>
        </div>
      </div>
    );
  }

  // Show paywall for authenticated users without subscription
  if (user && !subscription.subscribed) {
    return (
      <div className="min-h-screen bg-background spotlight film-grain">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-32">
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-10 cinematic-border text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 mx-auto mb-6 flex items-center justify-center">
                <Crown className="w-10 h-10 text-gold" />
              </div>
              
              <h2 className="font-display text-3xl mb-4">Unlock Director's OS</h2>
              
              <p className="text-muted-foreground mb-8">
                Start your 7-day free trial to access the full suite of transformation tools.
              </p>

              <div className="bg-card/50 rounded-lg p-6 mb-8 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <span className="text-sm">Unlimited Director AI conversations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <span className="text-sm">Full AI Media Studio access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <span className="text-sm">Daily Scorecard & Chief Aim Wizard</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <span className="text-sm">Mind Movie Theater & Gamification</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="font-display text-5xl text-gold">$29</div>
                <div className="text-muted-foreground text-sm">per month after trial</div>
              </div>

              <Button 
                variant="gold" 
                size="xl" 
                className="w-full gap-2"
                onClick={startCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Start 7-Day Free Trial
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground mt-4">
                Cancel anytime. No commitment required.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background spotlight film-grain">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Subscription Status Banner */}
          {subscription.isTrialing && (
            <div className="glass-card p-4 border-gold/30 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-gold" />
                  <div>
                    <span className="text-sm font-medium">Free Trial Active</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Ends {subscription.trialEnd ? new Date(subscription.trialEnd).toLocaleDateString() : 'soon'}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={openCustomerPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Manage Subscription"}
                </Button>
              </div>
            </div>
          )}

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
            onClick={() => setShowEditBay(true)}
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
      {showTheater && user && (
        <TheaterView onClose={() => setShowTheater(false)} />
      )}

      {/* Edit Bay */}
      {showEditBay && user && (
        <EditBay onClose={() => setShowEditBay(false)} />
      )}

      {/* Scorecard */}
      {showScorecard && user && (
        <DailyScorecard 
          onClose={() => setShowScorecard(false)} 
          onSubmitSuccess={handleScorecardSuccess}
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
