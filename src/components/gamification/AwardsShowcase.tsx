import { Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Award {
  type: string;
  name: string;
  description: string;
  icon: string;
}

interface EarnedAward {
  award_type: string;
  award_name: string;
  earned_at: string;
}

interface AwardsShowcaseProps {
  earnedAwards: EarnedAward[];
  availableAwards: Award[];
}

export const AwardsShowcase = ({
  earnedAwards,
  availableAwards,
}: AwardsShowcaseProps) => {
  const earnedTypes = earnedAwards.map((a) => a.award_type);

  return (
    <div className="glass-card p-6 cinematic-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-amber-soft/20 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h3 className="font-display text-lg">Director Awards</h3>
          <p className="text-sm text-muted-foreground">
            {earnedAwards.length} of {availableAwards.length} earned
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {availableAwards.map((award) => {
          const isEarned = earnedTypes.includes(award.type);
          const earnedAward = earnedAwards.find((a) => a.award_type === award.type);

          return (
            <div
              key={award.type}
              className={cn(
                "p-4 rounded-xl border transition-all",
                isEarned
                  ? "bg-gradient-to-br from-gold/20 to-amber-soft/10 border-gold/40 gold-glow"
                  : "bg-secondary/20 border-border opacity-60"
              )}
            >
              <div className="text-center">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl",
                    isEarned
                      ? "bg-gradient-to-br from-gold/30 to-amber-soft/20"
                      : "bg-secondary/50"
                  )}
                >
                  {isEarned ? award.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
                </div>
                <h4
                  className={cn(
                    "font-display text-sm mb-1",
                    isEarned ? "text-gold" : "text-muted-foreground"
                  )}
                >
                  {award.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {award.description}
                </p>
                {isEarned && earnedAward && (
                  <p className="text-xs text-gold/70 mt-2">
                    Earned {new Date(earnedAward.earned_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
