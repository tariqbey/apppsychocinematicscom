import { useState } from "react";
import { Trophy, Medal, Crown, Flame, Coins, X, Users, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard = ({ onClose }: LeaderboardProps) => {
  const { entries, loading, refresh } = useLeaderboard();
  const { profile, updateProfile } = useUserProfile();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleOptInToggle = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      await updateProfile({
        show_on_leaderboard: !profile?.show_on_leaderboard,
      });
      toast.success(
        profile?.show_on_leaderboard
          ? "You've been removed from the leaderboard"
          : "You're now visible on the leaderboard!"
      );
      refresh();
    } catch (err) {
      toast.error("Failed to update preference");
    } finally {
      setUpdating(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-gold" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-display">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-gold/20 to-amber-soft/10 border-gold/40";
      case 2:
        return "bg-gradient-to-r from-gray-300/10 to-gray-400/5 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-amber-700/5 border-amber-600/30";
      default:
        return "bg-secondary/30 border-border";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-amber-soft/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-display tracking-wide">
                <span className="text-gold-gradient">Director</span> Leaderboard
              </h1>
              <p className="text-muted-foreground text-sm">
                Top performers in the Psycho-Cinematics™ community
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Opt-in Toggle */}
        {user && (
          <div className="glass-card p-4 cinematic-border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile?.show_on_leaderboard ? (
                  <Eye className="w-5 h-5 text-gold" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Leaderboard Visibility</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.show_on_leaderboard
                      ? `Visible as "${profile.display_name || "Anonymous Director"}"`
                      : "Your stats are hidden from the leaderboard"}
                  </p>
                </div>
              </div>
              <Switch
                checked={profile?.show_on_leaderboard || false}
                onCheckedChange={handleOptInToggle}
                disabled={updating}
              />
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="glass-card cinematic-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary/30 text-sm text-muted-foreground">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Director</div>
            <div className="col-span-3 text-center flex items-center justify-center gap-1">
              <Coins className="w-4 h-4" /> Credits
            </div>
            <div className="col-span-3 text-center flex items-center justify-center gap-1">
              <Flame className="w-4 h-4" /> Streak
            </div>
          </div>

          {/* Entries */}
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-display mb-2">No Directors Yet</p>
              <p className="text-muted-foreground text-sm">
                Be the first to join the leaderboard by opting in above!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    "grid grid-cols-12 gap-4 p-4 items-center border-l-4 transition-colors hover:bg-secondary/20",
                    getRankStyle(entry.rank)
                  )}
                >
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-5">
                    <p
                      className={cn(
                        "font-display",
                        entry.rank <= 3 ? "text-gold" : "text-foreground"
                      )}
                    >
                      {entry.display_name}
                    </p>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="font-display text-lg">
                      {entry.lifetime_credits.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame
                        className={cn(
                          "w-4 h-4",
                          entry.current_streak >= 7 ? "text-orange-500" : "text-muted-foreground"
                        )}
                      />
                      <span className="font-display">
                        {entry.current_streak}
                        {entry.best_streak > entry.current_streak && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (best: {entry.best_streak})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Rankings are based on lifetime credits earned. Keep submitting your daily scorecards!
        </p>
      </div>
    </div>
  );
};
