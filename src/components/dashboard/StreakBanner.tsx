import { Flame, TrendingUp } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface StreakBannerProps {
  streak: number;
  bestStreak: number;
}

export const StreakBanner = ({ streak, bestStreak }: StreakBannerProps) => {
  return (
    <div className="glass-card p-4 cinematic-border animate-fade-in flex items-center justify-between" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-soft/20 to-cinematic-red/20 flex items-center justify-center">
          <Flame className={`w-6 h-6 text-amber-soft ${streak > 0 ? 'streak-fire' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Current Streak</p>
            <InfoTooltip content="Your streak increases each day you complete your Daily Scorecard. Consecutive days build momentum and reinforce your new identity. Aim for 90+ days!" />
          </div>
          <p className="text-2xl font-display text-foreground">{streak} Days</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Best</span>
          </div>
          <p className="text-xl font-display text-gold">{bestStreak} Days</p>
        </div>
      </div>
    </div>
  );
};
