import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ProductionStatus } from "@/components/dashboard/ProductionStatus";
import { DailyRitualChecklist } from "@/components/dashboard/DailyRitualChecklist";
import { DefiniteChiefAimCard } from "@/components/dashboard/DefiniteChiefAimCard";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { TheaterView } from "@/components/theater/TheaterView";
import { DirectorAIChat } from "@/components/director-ai/DirectorAIChat";
import { DailyScorecard } from "@/components/scorecard/DailyScorecard";

const Index = () => {
  const [showTheater, setShowTheater] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  // Mock data - would come from user profile/database
  const chiefAim = {
    what: "Build a $10M annual revenue business that creates transformational impact for 100,000 people",
    byWhen: "December 31, 2026",
    exchange: "I will dedicate 4 focused hours daily to high-leverage activities, continuously develop my skills, and build strategic partnerships",
    plan: "Launch the Psycho-Cinematics program, build a community of 10,000 directors, and scale through strategic content and partnerships",
  };

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
          <ProductionStatus currentAct="Act I: The Director Emerges" dayNumber={7} />

          {/* Streak Banner */}
          <StreakBanner streak={7} bestStreak={14} />

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
        </div>
      </main>

      {/* Theater View */}
      {showTheater && (
        <TheaterView streak={7} onClose={() => setShowTheater(false)} />
      )}

      {/* Scorecard */}
      {showScorecard && (
        <DailyScorecard onClose={() => setShowScorecard(false)} />
      )}

      {/* Director AI Chat */}
      <DirectorAIChat
        isOpen={showAIChat}
        onToggle={() => setShowAIChat(!showAIChat)}
        chiefAim={chiefAim.what}
      />
    </div>
  );
};

export default Index;
