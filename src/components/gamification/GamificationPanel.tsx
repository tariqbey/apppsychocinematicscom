import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditsDisplay } from "./CreditsDisplay";
import { AwardsShowcase } from "./AwardsShowcase";
import { DirectorScoreGraph } from "./DirectorScoreGraph";
import { useGamification } from "@/hooks/useGamification";
import { Loader2 } from "lucide-react";

interface GamificationPanelProps {
  onClose: () => void;
}

export const GamificationPanel = ({ onClose }: GamificationPanelProps) => {
  const { credits, awards, scorecards, loading, availableAwards } = useGamification();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display tracking-wide">
              <span className="text-gold-gradient">Director</span> Dashboard
            </h1>
            <p className="text-muted-foreground">
              Your journey to becoming the star of your own show
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Credits */}
          <CreditsDisplay
            credits={credits?.credits || 0}
            lifetimeCredits={credits?.lifetime_credits || 0}
          />

          {/* Score Graph */}
          <DirectorScoreGraph scorecards={scorecards} />

          {/* Awards */}
          <AwardsShowcase
            earnedAwards={awards}
            availableAwards={availableAwards}
          />
        </div>
      </div>
    </div>
  );
};
