import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, Crown, Star, TrendingUp, Sparkles, Heart, Award, 
  ArrowLeft, Film, Calendar, Medal, Flame
} from "lucide-react";
import { format } from "date-fns";

interface AwardWinner {
  category: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  movie_id?: string;
  movie_title?: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface YearlyStats {
  totalMovies: number;
  totalVotes: number;
  totalUsers: number;
  topScorers: Array<{ user_id: string; display_name: string; avatar_url: string | null; total_score: number }>;
  longestStreaks: Array<{ user_id: string; display_name: string; avatar_url: string | null; best_streak: number }>;
  mostVotedMovies: Array<{ movie_id: string; title: string; votes_count: number; user_id: string; display_name: string }>;
}

const awardCategories = [
  { key: "best_mind_movie", label: "Best Mind Movie", icon: Trophy, gradient: "from-gold via-amber-500 to-yellow-400", description: "The most inspiring Mind Movie of the year" },
  { key: "most_transformative_director", label: "Most Transformative Director", icon: Crown, gradient: "from-purple-500 via-pink-500 to-rose-400", description: "Greatest personal transformation journey" },
  { key: "highest_scorer", label: "Highest Scorer", icon: Star, gradient: "from-blue-500 via-cyan-500 to-teal-400", description: "Highest cumulative scorecard totals" },
  { key: "longest_streak", label: "Longest Streak", icon: TrendingUp, gradient: "from-green-500 via-emerald-500 to-teal-400", description: "Most consecutive days of ritual completion" },
  { key: "most_improved", label: "Most Improved", icon: Sparkles, gradient: "from-orange-500 via-red-500 to-pink-400", description: "Greatest improvement in scores over the year" },
  { key: "community_favorite", label: "Community Favorite", icon: Heart, gradient: "from-rose-500 via-red-500 to-orange-400", description: "Most loved member by community votes" },
  { key: "rising_star", label: "Rising Star", icon: Award, gradient: "from-indigo-500 via-purple-500 to-pink-400", description: "Breakout performer of the year" },
];

export default function AwardsCeremony() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [winners, setWinners] = useState<AwardWinner[]>([]);
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const availableYears = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
  ];

  useEffect(() => {
    fetchAwardsData(selectedYear);
  }, [selectedYear]);

  const fetchAwardsData = async (year: number) => {
    setLoading(true);
    try {
      // Fetch existing awards for the year
      const { data: existingAwards } = await supabase
        .from("annual_awards")
        .select("*")
        .eq("award_year", year);

      if (existingAwards && existingAwards.length > 0) {
        // Fetch user profiles for winners
        const userIds = [...new Set(existingAwards.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const formattedWinners = existingAwards.map(award => ({
          category: award.award_category,
          user_id: award.user_id,
          display_name: profileMap.get(award.user_id)?.display_name || "Anonymous Director",
          avatar_url: profileMap.get(award.user_id)?.avatar_url || null,
          movie_id: award.movie_id || undefined,
          score: award.total_score || award.total_votes || 0,
          metadata: (award.metadata as Record<string, unknown>) || {},
        }));

        setWinners(formattedWinners);
      } else {
        setWinners([]);
      }

      // Calculate yearly stats
      await calculateYearlyStats(year);
    } catch (error) {
      console.error("Error fetching awards data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateYearlyStats = async (year: number) => {
    try {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      // Get total community movies
      const { count: totalMovies } = await supabase
        .from("community_movies")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", startOfYear)
        .lte("submitted_at", endOfYear);

      // Get total votes
      const { data: votesData } = await supabase
        .from("movie_votes")
        .select("*")
        .gte("created_at", startOfYear)
        .lte("created_at", endOfYear);

      // Get user counts
      const { count: totalUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .lte("created_at", endOfYear);

      // Get top scorers (sum of daily scorecards)
      const { data: scorecardData } = await supabase
        .from("daily_scorecards")
        .select("user_id, total_score")
        .gte("scorecard_date", startOfYear)
        .lte("scorecard_date", endOfYear);

      const scoresByUser = new Map<string, number>();
      scorecardData?.forEach(s => {
        const current = scoresByUser.get(s.user_id) || 0;
        scoresByUser.set(s.user_id, current + (s.total_score || 0));
      });

      const topScorerIds = [...scoresByUser.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      const { data: topScorerProfiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", topScorerIds);

      const topScorers = topScorerIds.map(id => {
        const profile = topScorerProfiles?.find(p => p.user_id === id);
        return {
          user_id: id,
          display_name: profile?.display_name || "Anonymous",
          avatar_url: profile?.avatar_url || null,
          total_score: scoresByUser.get(id) || 0,
        };
      });

      // Get longest streaks
      const { data: streakData } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url, best_streak")
        .order("best_streak", { ascending: false })
        .limit(5);

      const longestStreaks = streakData?.map(s => ({
        user_id: s.user_id,
        display_name: s.display_name || "Anonymous",
        avatar_url: s.avatar_url,
        best_streak: s.best_streak || 0,
      })) || [];

      // Get most voted movies
      const { data: communityMoviesData } = await supabase
        .from("community_movies")
        .select("movie_id, title, votes_count, user_id")
        .order("votes_count", { ascending: false })
        .limit(5);

      const movieUserIds = communityMoviesData?.map(m => m.user_id) || [];
      const { data: movieUserProfiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", movieUserIds);

      const mostVotedMovies = communityMoviesData?.map(m => ({
        movie_id: m.movie_id,
        title: m.title,
        votes_count: m.votes_count || 0,
        user_id: m.user_id,
        display_name: movieUserProfiles?.find(p => p.user_id === m.user_id)?.display_name || "Anonymous",
      })) || [];

      setYearlyStats({
        totalMovies: totalMovies || 0,
        totalVotes: votesData?.length || 0,
        totalUsers: totalUsers || 0,
        topScorers,
        longestStreaks,
        mostVotedMovies,
      });
    } catch (error) {
      console.error("Error calculating yearly stats:", error);
    }
  };

  const calculateAndAwardWinners = async () => {
    if (selectedYear === new Date().getFullYear()) {
      return; // Can only calculate for completed years
    }

    setCalculating(true);
    try {
      // This would typically be done via an edge function for complex calculations
      // For now, we'll use the stats we've calculated
      
      if (!yearlyStats) return;

      const newAwards: Array<{
        user_id: string;
        award_year: number;
        award_category: string;
        total_score?: number | null;
        total_votes?: number | null;
        movie_id?: string | null;
        awarded_at: string;
      }> = [];

      // Highest Scorer
      if (yearlyStats.topScorers[0]) {
        newAwards.push({
          user_id: yearlyStats.topScorers[0].user_id,
          award_year: selectedYear,
          award_category: "highest_scorer",
          total_score: yearlyStats.topScorers[0].total_score,
          awarded_at: new Date().toISOString(),
        });
      }

      // Longest Streak
      if (yearlyStats.longestStreaks[0]) {
        newAwards.push({
          user_id: yearlyStats.longestStreaks[0].user_id,
          award_year: selectedYear,
          award_category: "longest_streak",
          total_score: yearlyStats.longestStreaks[0].best_streak,
          awarded_at: new Date().toISOString(),
        });
      }

      // Best Mind Movie (most voted)
      if (yearlyStats.mostVotedMovies[0]) {
        newAwards.push({
          user_id: yearlyStats.mostVotedMovies[0].user_id,
          award_year: selectedYear,
          award_category: "best_mind_movie",
          total_votes: yearlyStats.mostVotedMovies[0].votes_count,
          movie_id: yearlyStats.mostVotedMovies[0].movie_id,
          awarded_at: new Date().toISOString(),
        });
      }

      // Insert awards
      if (newAwards.length > 0) {
        const { error } = await supabase.from("annual_awards").insert(newAwards);
        if (error) throw error;
        
        await fetchAwardsData(selectedYear);
      }
    } catch (error) {
      console.error("Error calculating winners:", error);
    } finally {
      setCalculating(false);
    }
  };

  const getWinnerForCategory = (category: string) => {
    return winners.find(w => w.category === category);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-gold/20 bg-gradient-to-b from-gold/10 to-transparent">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Studio
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/30">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-display tracking-wide text-gold">
                Director Awards Ceremony
              </h1>
              <p className="text-muted-foreground">
                Celebrating the year's most transformative directors
              </p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-3 mt-6">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="flex gap-2">
              {availableYears.map(year => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "gold" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                  {year === new Date().getFullYear() && (
                    <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        {yearlyStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-gold mb-2">
                  <Film className="w-4 h-4" />
                  <span className="text-sm">Mind Movies</span>
                </div>
                <p className="text-3xl font-bold">{yearlyStats.totalMovies}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Total Votes</span>
                </div>
                <p className="text-3xl font-bold">{yearlyStats.totalVotes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">Directors</span>
                </div>
                <p className="text-3xl font-bold">{yearlyStats.totalUsers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm">Longest Streak</span>
                </div>
                <p className="text-3xl font-bold">{yearlyStats.longestStreaks[0]?.best_streak || 0} days</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="awards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="awards" className="gap-2">
              <Trophy className="w-4 h-4" />
              Awards
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="gap-2">
              <Medal className="w-4 h-4" />
              Leaderboards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="awards" className="space-y-6">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : winners.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {awardCategories.map(category => {
                  const winner = getWinnerForCategory(category.key);
                  const Icon = category.icon;

                  return (
                    <Card key={category.key} className={`relative overflow-hidden ${winner ? 'border-gold/30' : 'border-border opacity-60'}`}>
                      {/* Award Icon */}
                      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${category.gradient} opacity-20 blur-xl`} />
                      <div className={`absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <CardHeader className="pb-3">
                        <Badge variant="outline" className="w-fit text-xs">
                          {category.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </CardHeader>

                      <CardContent>
                        {winner ? (
                          <div className="flex items-center gap-4">
                            <Avatar className="w-14 h-14 border-2 border-gold/30">
                              <AvatarImage src={winner.avatar_url || undefined} />
                              <AvatarFallback className="bg-gold/20 text-gold font-display text-lg">
                                {winner.display_name[0]?.toUpperCase() || "D"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-display text-lg text-gold">{winner.display_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {winner.score > 0 && `Score: ${winner.score.toLocaleString()}`}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-14 text-muted-foreground text-sm">
                            {selectedYear === new Date().getFullYear() 
                              ? "Award pending - voting in progress" 
                              : "No winner yet"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                <h3 className="text-xl font-display mb-2">Awards Pending</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedYear === new Date().getFullYear() 
                    ? "The awards ceremony will be held at the end of the year based on votes, scores, and streaks."
                    : "No awards have been calculated for this year yet."}
                </p>
                {selectedYear < new Date().getFullYear() && (
                  <Button onClick={calculateAndAwardWinners} disabled={calculating} variant="gold">
                    {calculating ? "Calculating..." : "Calculate Winners"}
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboards" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Top Scorers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="w-5 h-5 text-gold" />
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {yearlyStats?.topScorers.map((scorer, index) => (
                    <div key={scorer.user_id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-gold text-primary-foreground' : 
                        index === 1 ? 'bg-slate-400 text-primary-foreground' : 
                        index === 2 ? 'bg-amber-600 text-primary-foreground' : 'bg-muted'
                      }`}>
                        {index + 1}
                      </span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={scorer.avatar_url || undefined} />
                        <AvatarFallback>{scorer.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm">{scorer.display_name}</span>
                      <span className="text-sm font-medium text-gold">{scorer.total_score.toLocaleString()}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Longest Streaks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Longest Streaks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {yearlyStats?.longestStreaks.map((user, index) => (
                    <div key={user.user_id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-orange-500 text-white' : 
                        index === 1 ? 'bg-orange-400 text-white' : 
                        index === 2 ? 'bg-orange-300 text-white' : 'bg-muted'
                      }`}>
                        {index + 1}
                      </span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm">{user.display_name}</span>
                      <span className="text-sm font-medium">{user.best_streak} days</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Most Voted Movies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Most Voted Movies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {yearlyStats?.mostVotedMovies.map((movie, index) => (
                    <div key={movie.movie_id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-rose-500 text-white' : 
                        index === 1 ? 'bg-rose-400 text-white' : 
                        index === 2 ? 'bg-rose-300 text-white' : 'bg-muted'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{movie.title}</p>
                        <p className="text-xs text-muted-foreground truncate">by {movie.display_name}</p>
                      </div>
                      <span className="text-sm font-medium text-rose-500">{movie.votes_count} votes</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
