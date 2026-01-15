import { Play, Vote, Film, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface CommunityMovieCardProps {
  id: string;
  movieId: string;
  title: string;
  description?: string;
  directorName: string;
  avatarUrl?: string;
  movieUrl: string;
  thumbnailUrl?: string;
  chiefAimPreview?: string;
  votesCount: number;
  hasVoted: boolean;
  submittedAt: string;
  onVote: (movieId: string) => void;
  rank?: number;
}

export const CommunityMovieCard = ({
  id,
  movieId,
  title,
  description,
  directorName,
  avatarUrl,
  movieUrl,
  thumbnailUrl,
  chiefAimPreview,
  votesCount,
  hasVoted,
  submittedAt,
  onVote,
  rank,
}: CommunityMovieCardProps) => {
  return (
    <div className="glass-card cinematic-border p-4 hover:border-gold/50 transition-all duration-300 group">
      <div className="flex gap-4">
        {/* Rank badge */}
        {rank && rank <= 3 && (
          <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
            ${rank === 1 ? "bg-gradient-to-br from-gold to-amber-600 text-black" : ""}
            ${rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black" : ""}
            ${rank === 3 ? "bg-gradient-to-br from-amber-700 to-amber-900 text-white" : ""}
          `}>
            #{rank}
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative w-28 h-20 rounded-lg overflow-hidden bg-card flex-shrink-0 border border-border">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Film className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <a
            href={movieUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="w-6 h-6 text-white" />
          </a>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display text-base text-foreground truncate group-hover:text-gold transition-colors">
              {title}
            </h4>
            <a
              href={movieUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Avatar className="w-5 h-5 border border-gold/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gold/10 text-gold text-[10px]">
                {directorName?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{directorName}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(submittedAt), { addSuffix: true })}
            </span>
          </div>

          {chiefAimPreview && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
              "{chiefAimPreview}"
            </p>
          )}

          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {/* Vote button */}
        <div className="flex flex-col items-center justify-center gap-1">
          <Button
            variant={hasVoted ? "gold" : "outline"}
            size="sm"
            onClick={() => onVote(movieId)}
            className={`px-3 ${hasVoted ? "" : "hover:border-gold hover:text-gold"}`}
          >
            <Vote className="w-4 h-4 mr-1" />
            {votesCount}
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {hasVoted ? "Voted!" : "Vote"}
          </span>
        </div>
      </div>
    </div>
  );
};
