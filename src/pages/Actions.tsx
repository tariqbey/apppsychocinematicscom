import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, User, Calendar, Crown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ThreeThings } from "@/components/tasks/ThreeThings";
import { ExcuseAnalytics } from "@/components/tasks/ExcuseAnalytics";
import { CharacterCentral } from "@/components/character/CharacterCentral";
import { AnnualSelfAnalysis } from "@/components/character/AnnualSelfAnalysis";
import { CharacterScorecard } from "@/components/character/CharacterScorecard";
import { CharacterWeeklySummary } from "@/components/character/CharacterWeeklySummary";
import { EpisodesList } from "@/components/episodes/EpisodesList";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Actions() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAnnualAnalysis, setShowAnnualAnalysis] = useState(false);
  const [showCharacterScorecard, setShowCharacterScorecard] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display tracking-wide">Action Execution</h1>
              <p className="text-muted-foreground">Your daily priorities & accountability tracking</p>
            </div>
          </div>
        </div>

        {/* Three Things - Daily Task Manager */}
        <ThreeThings showAnalyticsDefault={true} />

        {/* Episodes Section */}
        <EpisodesList />

        {/* Character Central Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display tracking-wide">Character Central</h2>
                <p className="text-sm text-muted-foreground">Discover & develop your director archetype</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowCharacterScorecard(true)}
              className="gap-2 border-gold/50 text-gold hover:bg-gold/10"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Character Scorecard</span>
              <span className="sm:hidden">Score</span>
            </Button>
          </div>
          <CharacterCentral />
        </div>

        {/* Annual Self-Analysis Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-display tracking-wide">Annual Self-Analysis</h2>
              <p className="text-sm text-muted-foreground">Year-end reflection based on Napoleon Hill's questionnaire</p>
            </div>
          </div>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Personal Inventory Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                "Annual self-analysis is essential in the effective marketing of personal services. 
                The yearly analysis should disclose a decrease in faults and an increase in virtues. 
                One goes ahead, stands still or goes backward in life. One's object should be, of course, to go ahead."
              </p>
              <p className="text-xs text-gold/70">— Napoleon Hill, Think and Grow Rich</p>
              <Button 
                onClick={() => setShowAnnualAnalysis(true)}
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Calendar className="h-4 w-4" />
                Begin Year-End Reflection
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Character Summary */}
        <CharacterWeeklySummary />

        {/* Full Analytics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display tracking-wide">Your Excuse Patterns</h2>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </div>
          <ExcuseAnalytics />
        </div>
      </main>

      {/* Annual Self-Analysis Modal */}
      {showAnnualAnalysis && (
        <AnnualSelfAnalysis onClose={() => setShowAnnualAnalysis(false)} />
      )}

      {/* Character Scorecard Modal */}
      {showCharacterScorecard && (
        <CharacterScorecard onClose={() => setShowCharacterScorecard(false)} />
      )}
    </div>
  );
}