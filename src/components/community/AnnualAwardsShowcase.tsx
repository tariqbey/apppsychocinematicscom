import { Trophy, Award, Star, Crown, TrendingUp, Heart, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AnnualAward {
  id: string;
  user_id: string;
  award_year: number;
  award_category: string;
  total_votes: number | null;
  total_score: number | null;
  awarded_at: string | null;
  display_name?: string;
  avatar_url?: string;
}

interface AnnualAwardsShowcaseProps {
  awards: AnnualAward[];
  year?: number;
}

const awardConfig: Record<string, { label: string; icon: React.ElementType; gradient: string }> = {
  best_mind_movie: {
    label: "Best Mind Movie",
    icon: Trophy,
    gradient: "from-gold via-amber-500 to-yellow-400",
  },
  most_transformative_director: {
    label: "Most Transformative Director",
    icon: Crown,
    gradient: "from-purple-500 via-pink-500 to-rose-400",
  },
  highest_scorer: {
    label: "Highest Scorer",
    icon: Star,
    gradient: "from-blue-500 via-cyan-500 to-teal-400",
  },
  longest_streak: {
    label: "Longest Streak",
    icon: TrendingUp,
    gradient: "from-green-500 via-emerald-500 to-teal-400",
  },
  most_improved: {
    label: "Most Improved",
    icon: Sparkles,
    gradient: "from-orange-500 via-red-500 to-pink-400",
  },
  community_favorite: {
    label: "Community Favorite",
    icon: Heart,
    gradient: "from-rose-500 via-red-500 to-orange-400",
  },
  rising_star: {
    label: "Rising Star",
    icon: Award,
    gradient: "from-indigo-500 via-purple-500 to-pink-400",
  },
};

export const AnnualAwardsShowcase = ({ awards, year }: AnnualAwardsShowcaseProps) => {
  const displayYear = year || new Date().getFullYear();
  const yearAwards = awards.filter((a) => a.award_year === displayYear);

  if (yearAwards.length === 0) {
    return (
      <div className="glass-card cinematic-border p-6 text-center">
        <Trophy className="w-12 h-12 text-gold/30 mx-auto mb-3" />
        <h3 className="font-display text-lg mb-2">Annual Director Awards</h3>
        <p className="text-sm text-muted-foreground">
          The {displayYear} Psycho-Cinematics™ Oscar ceremony will recognize our top Directors at year's end.
          Keep creating, voting, and transforming!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card cinematic-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-gold" />
        <h3 className="font-display text-xl">
          {displayYear} <span className="text-gold-gradient">Director Awards</span>
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {yearAwards.map((award) => {
          const config = awardConfig[award.award_category] || awardConfig.rising_star;
          const Icon = config.icon;

          return (
            <div
              key={award.id}
              className="relative p-4 rounded-lg bg-gradient-to-br from-card to-muted/50 border border-border group hover:border-gold/30 transition-colors"
            >
              {/* Award icon */}
              <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <Badge variant="outline" className="text-xs mb-3">
                {config.label}
              </Badge>

              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-gold/30">
                  <AvatarImage src={award.avatar_url} />
                  <AvatarFallback className="bg-gold/20 text-gold font-display">
                    {award.display_name?.[0]?.toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display text-gold">{award.display_name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">
                    {(award.total_votes || 0) > 0 ? `${award.total_votes} votes` : ""}
                    {(award.total_score || 0) > 0 ? ` • ${award.total_score} points` : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
