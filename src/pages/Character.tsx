import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { CharacterCentral } from "@/components/character/CharacterCentral";
import { CharacterScorecard } from "@/components/character/CharacterScorecard";
import { CharacterWeeklySummary } from "@/components/character/CharacterWeeklySummary";
import { CharacterTransformationCoach } from "@/components/character/CharacterTransformationCoach";
import { AnnualSelfAnalysis } from "@/components/character/AnnualSelfAnalysis";
import { CharacterEvolution } from "@/components/character/CharacterEvolution";
import { CycleProgress } from "@/components/character/CycleProgress";
import { CycleReviewWizard } from "@/components/character/CycleReviewWizard";
import { useAuth } from "@/hooks/useAuth";
import { useCycleTracking } from "@/hooks/useCycleTracking";
import { Loader2, ArrowLeft, User2, Target, TrendingUp, Brain, Calendar, GitBranch, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const Character = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refetch } = useCycleTracking();
  const [showCycleReview, setShowCycleReview] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading character builder...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background spotlight film-grain">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button & Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display tracking-wide">
                <span className="text-gold-gradient">Character Builder</span>
              </h1>
              <p className="text-muted-foreground">
                Design your Director identity and track your transformation
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="cycles" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="cycles" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">21 Days</span>
              </TabsTrigger>
              <TabsTrigger value="archetype" className="flex items-center gap-2">
                <User2 className="w-4 h-4" />
                <span className="hidden sm:inline">Archetype</span>
              </TabsTrigger>
              <TabsTrigger value="evolution" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">Evolution</span>
              </TabsTrigger>
              <TabsTrigger value="scorecard" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Scorecard</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Weekly</span>
              </TabsTrigger>
              <TabsTrigger value="transformation" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Transform</span>
              </TabsTrigger>
              <TabsTrigger value="annual" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Annual</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cycles" className="space-y-6">
              <CycleProgress onStartReview={() => setShowCycleReview(true)} />
              
              {/* Cycle explanation card */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-display">How 21-Day Cycles Work</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="font-medium text-gold mb-2">🔄 21-Day Cycle</p>
                    <p className="text-muted-foreground">
                      The fundamental unit of behavioral change. Each cycle has a theme and ends with a comprehensive review.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="font-medium text-amber-400 mb-2">🎬 3 Cycles = 1 Act</p>
                    <p className="text-muted-foreground">
                      Every 3 cycles (63 days) completes an Act in your transformation story: Foundation → Integration → Mastery.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="font-medium text-green-400 mb-2">🏆 Cycle Review</p>
                    <p className="text-muted-foreground">
                      At day 21, review your scorecard averages, character evolution, and get AI analysis of your progress.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="archetype" className="space-y-6">
              <CharacterCentral />
            </TabsContent>

            <TabsContent value="evolution" className="space-y-6">
              <CharacterEvolution inline />
            </TabsContent>

            <TabsContent value="scorecard" className="space-y-6">
              <CharacterScorecard inline />
            </TabsContent>

            <TabsContent value="weekly" className="space-y-6">
              <CharacterWeeklySummary />
            </TabsContent>

            <TabsContent value="transformation" className="space-y-6">
              <CharacterTransformationCoach inline />
            </TabsContent>

            <TabsContent value="annual" className="space-y-6">
              <AnnualSelfAnalysis inline />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Cycle Review Wizard */}
      <CycleReviewWizard
        isOpen={showCycleReview}
        onClose={() => setShowCycleReview(false)}
        onComplete={() => {
          refetch();
          setShowCycleReview(false);
        }}
      />
    </div>
  );
};

export default Character;
