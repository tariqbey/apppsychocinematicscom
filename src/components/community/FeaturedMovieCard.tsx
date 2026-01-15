import { Trophy, Star, Play, Vote, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeaturedMovieCardProps {
  title: string;
  directorName: string;
  avatarUrl?: string;
  movieUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  votes: number;
  featureType: "movie_of_week" | "director_of_month" | "movie_of_month";
  periodLabel: string;
}

const featureTypeConfig = {
  movie_of_week: {
    label: "Mind Movie of the Week",
    icon: Star,
    gradient: "from-gold via-amber-500 to-orange-500",
    bgGradient: "from-gold/20 to-amber-500/10",
  },
  director_of_month: {
    label: "Director of the Month",
    icon: Crown,
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    bgGradient: "from-purple-500/20 to-pink-500/10",
  },
  movie_of_month: {
    label: "Mind Movie of the Month",
    icon: Trophy,
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    bgGradient: "from-blue-500/20 to-cyan-500/10",
  },
};

export const FeaturedMovieCard = ({
  title,
  directorName,
  avatarUrl,
  movieUrl,
  thumbnailUrl,
  description,
  votes,
  featureType,
  periodLabel,
}: FeaturedMovieCardProps) => {
  const config = featureTypeConfig[featureType];
  const Icon = config.icon;

  return (
    <div className={`glass-card cinematic-border p-6 bg-gradient-to-br ${config.bgGradient} relative overflow-hidden`}>
      {/* Award badge */}
      <div className="absolute top-0 right-0">
        <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0 rounded-none rounded-bl-lg px-3 py-1`}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Period label */}
      <p className="text-xs text-muted-foreground mb-4">{periodLabel}</p>

      <div className="flex gap-4">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            {movieUrl && (
              <a
                href={movieUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
              >
                <Play className="w-8 h-8 text-white" />
              </a>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-gold truncate">{title}</h3>
          
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="w-6 h-6 border border-gold/30">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gold/20 text-gold text-xs">
                {directorName?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{directorName}</span>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-gold">
              <Vote className="w-4 h-4" />
              <span className="text-sm font-semibold">{votes}</span>
              <span className="text-xs text-muted-foreground">votes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
