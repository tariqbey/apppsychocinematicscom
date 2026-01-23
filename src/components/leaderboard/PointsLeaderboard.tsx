import { useState } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  X,
  Users,
  Eye,
  EyeOff,
  Loader2,
  Star,
  Calendar,
  TrendingUp,
  Award,
  ChartLine,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePointsLeaderboard, TimePeriod } from "@/hooks/usePointsLeaderboard";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { usePoints, POINTS_CONFIG } from "@/hooks/usePoints";
import { PointsHistoryChart } from "./PointsHistoryChart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PointsLeaderboardProps {
  onClose: () => void;
}

export const PointsLeaderboard = ({ onClose }: PointsLeaderboardProps) => {
  const { entries, period, loading, changePeriod, refresh } = usePointsLeaderboard("all_time");
  const { profile, updateProfile } = useUserProfile();
  const { user } = useAuth();
  const { todayPoints, summary, recalculateToday } = usePoints();
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
    } catch {
      toast.error("Failed to update preference");
    } finally {
      setUpdating(false);
    }
  };

  const handleRecalculate = async () => {
    await recalculateToday();
    refresh();
    toast.success("Points recalculated!");
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-gold drop-shadow-lg" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-display text-sm">
            {rank}
          </span>
        );
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-gold/20 via-amber-500/10 to-gold/20 border-gold/50 shadow-lg shadow-gold/10";
      case 2:
        return "bg-gradient-to-r from-gray-300/15 to-gray-400/5 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/15 to-amber-700/5 border-amber-600/30";
      default:
        return "bg-secondary/20 border-border/50 hover:bg-secondary/40";
    }
  };

  const getPeriodLabel = (p: TimePeriod) => {
    switch (p) {
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      case "yearly":
        return "This Year";
      case "all_time":
        return "All Time";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/40 to-amber-soft/20 flex items-center justify-center shadow-lg shadow-gold/20">
              <Trophy className="w-7 h-7 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display tracking-wide">
                <span className="text-gold-gradient">Points</span> Leaderboard
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Compete with fellow directors
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Period Tabs */}
        <Tabs
          value={period}
          onValueChange={(v) => changePeriod(v as TimePeriod)}
          className="mb-4"
        >
          <TabsList className="grid grid-cols-4 bg-secondary/30 p-1">
            <TabsTrigger
              value="weekly"
              className="text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
            >
              <Calendar className="w-3 h-3 mr-1 hidden sm:inline" />
              Week
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
            >
              <TrendingUp className="w-3 h-3 mr-1 hidden sm:inline" />
              Month
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              className="text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
            >
              <Award className="w-3 h-3 mr-1 hidden sm:inline" />
              Year
            </TabsTrigger>
            <TabsTrigger
              value="all_time"
              className="text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
            >
              <Star className="w-3 h-3 mr-1 hidden sm:inline" />
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Your Stats + History */}
        {user && (
          <Tabs defaultValue="today" className="mb-4">
            <TabsList className="grid grid-cols-2 bg-secondary/30 p-1 mb-3">
              <TabsTrigger value="today" className="text-xs data-[state=active]:bg-gold/20">
                <Info className="w-3 h-3 mr-1" />
                Today
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs data-[state=active]:bg-gold/20">
                <ChartLine className="w-3 h-3 mr-1" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-0">
              {todayPoints ? (
                <div className="glass-card p-4 cinematic-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-gold text-sm">Your Points Today</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRecalculate}
                      className="text-xs h-7"
                    >
                      Refresh
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-lg font-display text-gold">{todayPoints.total_points}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-lg font-display text-green-400">+{todayPoints.ritual_points + todayPoints.task_points}</p>
                      <p className="text-[10px] text-muted-foreground">Actions</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-lg font-display text-blue-400">+{todayPoints.bonus_points}</p>
                      <p className="text-[10px] text-muted-foreground">Bonus</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-lg font-display text-red-400">-{todayPoints.penalty_points}</p>
                      <p className="text-[10px] text-muted-foreground">Penalty</p>
                    </div>
                  </div>
                  {summary && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground text-center">
                        {getPeriodLabel(period)} Total:{" "}
                        <span className="text-gold font-display">{summary.total_points.toLocaleString()}</span>
                        {" · "}
                        {summary.days_active} day{summary.days_active !== 1 ? "s" : ""} active
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card p-4 cinematic-border text-center">
                  <p className="text-muted-foreground text-sm">No points yet today. Complete rituals and tasks to earn points!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="glass-card p-4 cinematic-border">
                <PointsHistoryChart />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Opt-in Toggle */}
        {user && (
          <div className="glass-card p-3 cinematic-border mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {profile?.show_on_leaderboard ? (
                  <Eye className="w-4 h-4 text-gold" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Leaderboard Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.show_on_leaderboard
                      ? `Visible as "${profile.display_name || "Anonymous"}"`
                      : "Hidden from leaderboard"}
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
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 bg-secondary/20 text-xs text-muted-foreground font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Director</div>
            <div className="col-span-3 text-right">Points</div>
            <div className="col-span-2 text-right">
              <Flame className="w-3 h-3 inline" />
            </div>
          </div>

          {/* Entries */}
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-display mb-2">No Directors Yet</p>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Be the first to join the leaderboard! Complete rituals, tasks, and journal entries to earn points.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {entries.map((entry) => (
                <div
                  key={entry.user_id}
                  className={cn(
                    "grid grid-cols-12 gap-2 px-4 py-3 items-center border-l-4 transition-all duration-200",
                    getRankStyle(entry.rank)
                  )}
                >
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-6 flex items-center gap-2 min-w-0">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-xs">
                        {entry.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p
                      className={cn(
                        "font-display truncate text-sm",
                        entry.rank <= 3 ? "text-gold" : "text-foreground"
                      )}
                    >
                      {entry.display_name}
                    </p>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-display text-base sm:text-lg">
                      {entry.total_points.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Flame
                        className={cn(
                          "w-3 h-3",
                          entry.current_streak >= 7
                            ? "text-orange-500"
                            : "text-muted-foreground/50"
                        )}
                      />
                      <span className="font-display text-sm">
                        {entry.current_streak}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Points Formula Info */}
        <div className="mt-4 p-4 glass-card cinematic-border">
          <h4 className="font-display text-gold text-sm mb-3">How Points Work</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Task completed</span>
              <span className="text-green-400">+{POINTS_CONFIG.taskCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">All 3 tasks done</span>
              <span className="text-green-400">+{POINTS_CONFIG.allThreeTasksBonus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Journal entry</span>
              <span className="text-green-400">+{POINTS_CONFIG.journalEntry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Breakthrough entry</span>
              <span className="text-green-400">+{POINTS_CONFIG.journalWithBreakthrough}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">All rituals done</span>
              <span className="text-green-400">+{POINTS_CONFIG.allRitualsBonus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Perfect scorecard</span>
              <span className="text-green-400">+{POINTS_CONFIG.perfectScoreBonus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Super bonus (all done)</span>
              <span className="text-gold">+{POINTS_CONFIG.superBonus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Procrastination</span>
              <span className="text-red-400">{POINTS_CONFIG.penalties.procrastination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Others' movie</span>
              <span className="text-red-400">{POINTS_CONFIG.penalties.others_movie}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ran out of time</span>
              <span className="text-red-400">{POINTS_CONFIG.penalties.ran_out_of_time}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {getPeriodLabel(period)} rankings • Updated in real-time
        </p>
      </div>
    </div>
  );
};
