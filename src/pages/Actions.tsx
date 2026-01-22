import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, BarChart3 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ThreeThings } from "@/components/tasks/ThreeThings";
import { ExcuseAnalytics } from "@/components/tasks/ExcuseAnalytics";
import { EpisodesList } from "@/components/episodes/EpisodesList";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Actions() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tasks");

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
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 sm:pt-28 pb-24 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display tracking-wide truncate">Action Hub</h1>
              <p className="text-sm text-muted-foreground truncate">Daily priorities & accountability</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="tasks" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Three Things</span>
              <span className="sm:hidden">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="episodes" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Episodes</span>
              <span className="sm:hidden">Eps</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Patterns</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <ThreeThings />
          </TabsContent>

          <TabsContent value="episodes" className="space-y-6">
            <EpisodesList />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ExcuseAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
