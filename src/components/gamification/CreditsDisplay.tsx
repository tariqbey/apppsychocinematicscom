import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditsDisplayProps {
  credits: number;
  lifetimeCredits?: number;
  compact?: boolean;
}

export const CreditsDisplay = ({
  credits,
  lifetimeCredits,
  compact = false,
}: CreditsDisplayProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-gold/20 to-amber-soft/10 border border-gold/30">
        <Coins className="w-4 h-4 text-gold" />
        <span className="font-display text-sm text-gold">{credits.toLocaleString()}</span>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 cinematic-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-amber-soft/20 flex items-center justify-center">
          <Coins className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h3 className="font-display text-lg">Director Credits</h3>
          <p className="text-sm text-muted-foreground">Earned through daily excellence</p>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-display text-gold">{credits.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Available Credits</p>
        </div>
        {lifetimeCredits !== undefined && (
          <div className="text-right">
            <p className="text-xl font-display text-foreground/80">
              {lifetimeCredits.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Lifetime Earned</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border">
        <p className="text-xs text-muted-foreground text-center">
          Earn credits by submitting daily scorecards. Bonus credits for perfect scores!
        </p>
      </div>
    </div>
  );
};
