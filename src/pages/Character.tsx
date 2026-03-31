import { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Header } from "@/components/layout/Header";
import { CharacterCentral } from "@/components/character/CharacterCentral";
import { CharacterScorecard } from "@/components/character/CharacterScorecard";
import { CharacterWeeklySummary } from "@/components/character/CharacterWeeklySummary";
import { CharacterTransformationCoach } from "@/components/character/CharacterTransformationCoach";
import { CharacterEvolution } from "@/components/character/CharacterEvolution";
import { CycleProgress } from "@/components/character/CycleProgress";
import { CycleReviewWizard } from "@/components/character/CycleReviewWizard";
import { TransformationRoadmap } from "@/components/character/TransformationRoadmap";
import { CharacterCreator } from "@/components/character/CharacterCreator";
import { AICharacterAnalysis } from "@/components/character/AICharacterAnalysis";
import { AnimatedCharacterCharts } from "@/components/character/AnimatedCharacterCharts";
import { ArchetypesGuide } from "@/components/character/ArchetypesGuide";
import { ArchetypeResult } from "@/components/character/ArchetypeResult";
import { SelfAnalysisReminder } from "@/components/character/SelfAnalysisReminder";
import { CharacterSurvey } from "@/components/character/CharacterSurvey";
import { useAuth } from "@/hooks/useAuth";
import { useCycleTracking } from "@/hooks/useCycleTracking";
import { Loader2, ArrowLeft, User2, Target, TrendingUp, Brain, Calendar, GitBranch, RotateCcw, UserPlus, Sparkles, BarChart3, BookOpen, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Archetype } from "@/components/character/archetypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Character = () => {
  useDocumentTitle("Character | Director's OS");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refetch } = useCycleTracking();
  const { toast } = useToast();
  const [showCycleReview, setShowCycleReview] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultArchetype, setResultArchetype] = useState<Archetype | null>(null);
  const [resultScores, setResultScores] = useState<Record<string, number>>({});

  const handleSurveyComplete = async (
    archetype: Archetype,
    scores: Record<string, number>,
    responses: Record<string, string>
  ) => {
    if (!user) return;

    // Save to database
    const { error } = await supabase
      .from("character_profiles")
      .upsert(
        {
          user_id: user.id,
          archetype: archetype.id,
          archetype_score: scores,
          survey_responses: responses,
          light_shadow_state: "light",
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again",
        variant: "destructive"
      });
      console.error("Error saving character profile:", error);
    } else {
      toast({
        title: "Character Profile Saved!",
        description: `You are The ${archetype.name}`,
      });
      
      // Store results for display
      setResultArchetype(archetype);
      setResultScores(scores);
      setShowResult(true);
    }

    setShowSurvey(false);
  };

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
    <div className="min-h-screen bg-background spotlight film-grain overflow-auto">
      <Header />

      <main className="container mx-auto px-4 pt-28 sm:pt-32 pb-32 overflow-visible">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button & Header - positioned to avoid logo overlap */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-display tracking-wide truncate">
                <span className="text-gold-gradient">Character Builder</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Design your Director identity and track your transformation
              </p>
            </div>
          </div>

          {/* 21-Day Self-Analysis Reminder */}
          <SelfAnalysisReminder onStartAnalysis={() => setShowSurvey(true)} />

          {/* Tabs Navigation */}
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-5 sm:grid-cols-10 mb-6 h-auto">
              <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="self-analysis" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <ClipboardList className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Self-Analysis</span>
                <span className="text-xs sm:hidden">Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Guide</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs sm:text-sm">AI</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <UserPlus className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Create</span>
              </TabsTrigger>
              <TabsTrigger value="cycles" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <RotateCcw className="w-4 h-4" />
                <span className="text-xs sm:text-sm">21 Days</span>
              </TabsTrigger>
              <TabsTrigger value="archetype" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <User2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Archetype</span>
                <span className="text-xs sm:hidden">Type</span>
              </TabsTrigger>
              <TabsTrigger value="evolution" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <GitBranch className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Evolution</span>
                <span className="text-xs sm:hidden">Evo</span>
              </TabsTrigger>
              <TabsTrigger value="scorecard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <Target className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Score</span>
              </TabsTrigger>
              <TabsTrigger value="transformation" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
                <Brain className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Transform</span>
                <span className="text-xs sm:hidden">Coach</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
              <AnimatedCharacterCharts />
              <CharacterWeeklySummary />
            </TabsContent>

            <TabsContent value="self-analysis" className="space-y-6">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display text-gold">Character Self-Analysis</h2>
                    <p className="text-sm text-muted-foreground">28-question Metu Neter assessment</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This comprehensive 28-question assessment reveals your Director archetype based on the 
                  11 Spheres of the Metu Neter. Answer honestly—shadow responses reveal your growth edges 
                  and help the AI coach you more effectively.
                </p>
                <Button 
                  variant="gold" 
                  onClick={() => setShowSurvey(true)} 
                  className="w-full gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Begin Self-Analysis
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="guide" className="space-y-6">
              <ArchetypesGuide />
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <AICharacterAnalysis />
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <CharacterCreator />
            </TabsContent>

            <TabsContent value="cycles" className="space-y-6">
              <CycleProgress onStartReview={() => setShowCycleReview(true)} />
              
              {/* Transformation Roadmap */}
              <TransformationRoadmap />
              
              {/* Cycle explanation card */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-display">The 3-4-3 Transformation Structure</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="font-medium text-amber-400 mb-2">🌅 Act I: Awakening</p>
                    <p className="text-muted-foreground">
                      3 cycles (63 days) to establish your foundation, build awareness, and set the stage for transformation.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gold/10 border border-gold/30">
                    <p className="font-medium text-gold mb-2">⚡ Act II: Integration</p>
                    <p className="text-muted-foreground">
                      4 cycles (84 days) of deep work. The longest act where real behavioral change takes root.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="font-medium text-emerald-400 mb-2">👑 Act III: Mastery</p>
                    <p className="text-muted-foreground">
                      3 cycles (63 days) to solidify your new identity and embody your transformed character.
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

            <TabsContent value="transformation" className="space-y-6">
              <CharacterTransformationCoach inline />
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

      {/* Character Survey Modal */}
      {showSurvey && (
        <CharacterSurvey
          onComplete={handleSurveyComplete}
          onClose={() => setShowSurvey(false)}
        />
      )}

      {/* Archetype Result Modal */}
      {showResult && resultArchetype && (
        <ArchetypeResult
          archetype={resultArchetype}
          scores={resultScores}
          onClose={() => setShowResult(false)}
          onRetake={() => {
            setShowResult(false);
            setShowSurvey(true);
          }}
        />
      )}
    </div>
  );
};

export default Character;
