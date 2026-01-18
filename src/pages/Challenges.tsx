import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useEpisodes } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Swords, 
  Trophy, 
  Zap, 
  Target, 
  Brain, 
  Scissors, 
  Lightbulb, 
  CheckCircle2, 
  Plus,
  Flame,
  Shield,
  Heart,
  ArrowRight,
  TrendingUp,
  Calendar,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { AdversityChallengeGenerator } from "@/components/challenges/AdversityChallengeGenerator";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { CharacterProgressDashboard } from "@/components/challenges/CharacterProgressDashboard";
import { LandingPage } from "@/components/landing/LandingPage";
import { AuthModal } from "@/components/auth/AuthModal";

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
}

export default function Challenges() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeEpisode } = useEpisodes();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [challenges, setChallenges] = useState<AdversityChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activeTab, setActiveTab] = useState("challenges");

  const fetchChallenges = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("adversity_challenges")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user, fetchChallenges]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={() => setShowAuthModal(true)} />;
  }

  const pendingChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed);
  const totalXP = challenges.reduce((sum, c) => sum + (c.trait_xp_earned || 0), 0);

  return (
    <div className="min-h-screen bg-background spotlight film-grain">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-600/20 flex items-center justify-center">
                  <Swords className="w-6 h-6 text-red-500" />
                </div>
                <h1 className="text-3xl font-display tracking-wide">Challenges & Adversity</h1>
              </div>
              <p className="text-muted-foreground">
                Train your character through scenario-based emotional adversity
              </p>
            </div>
            <Button variant="gold" onClick={() => setShowGenerator(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Challenge
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gold">{totalXP}</p>
              <p className="text-xs text-muted-foreground">Total XP Earned</p>
            </Card>
            <Card className="p-4 text-center">
              <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pendingChallenges.length}</p>
              <p className="text-xs text-muted-foreground">Active Challenges</p>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedChallenges.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </Card>
            <Card className="p-4 text-center">
              <Shield className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {challenges.filter(c => c.did_cut).length}
              </p>
              <p className="text-xs text-muted-foreground">Times "CUT!"</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="challenges" className="gap-2">
                <Swords className="w-4 h-4" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Calendar className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Active Challenges Tab */}
            <TabsContent value="challenges" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingChallenges.length === 0 ? (
                <Card className="p-8 text-center">
                  <Swords className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-display mb-2">No Active Challenges</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate a new challenge to train your character traits
                  </p>
                  <Button variant="gold" onClick={() => setShowGenerator(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Your First Challenge
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onComplete={fetchChallenges}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress">
              <CharacterProgressDashboard 
                challenges={challenges}
                activeEpisode={activeEpisode}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <ScrollArea className="h-[600px]">
                {completedChallenges.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Completed Challenges Yet</h3>
                    <p className="text-muted-foreground">
                      Complete challenges to see your history and XP growth
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {completedChallenges.map((challenge) => (
                      <Card key={challenge.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              challenge.did_cut 
                                ? "bg-green-500/20" 
                                : "bg-red-500/20"
                            }`}>
                              {challenge.did_cut ? (
                                <Scissors className="w-5 h-5 text-green-500" />
                              ) : (
                                <Heart className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{challenge.target_trait}</Badge>
                                <Badge variant="secondary">{challenge.scenario_type}</Badge>
                              </div>
                              <p className="text-sm line-clamp-2">{challenge.situation_description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(challenge.challenge_date), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gold">
                              +{challenge.trait_xp_earned || 0} XP
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {challenge.at_peace ? "At Peace ✓" : "Processing"}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Challenge Generator Modal */}
      <AdversityChallengeGenerator
        open={showGenerator}
        onOpenChange={setShowGenerator}
        onChallengeCreated={fetchChallenges}
        activeEpisode={activeEpisode}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
