import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ThreeThings } from "@/components/tasks/ThreeThings";
import { ExcuseAnalytics } from "@/components/tasks/ExcuseAnalytics";
import { useEffect } from "react";

export default function Actions() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

        {/* Full Analytics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display tracking-wide">Your Excuse Patterns</h2>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </div>
          <ExcuseAnalytics />
        </div>
      </main>
    </div>
  );
}
