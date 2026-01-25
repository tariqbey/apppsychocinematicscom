import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Target, Lightbulb, Handshake, ChevronDown, ChevronUp, 
  Sparkles, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectorProfileCardProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  publicVision?: string;
  skills?: string[];
  lookingFor?: string;
  canOffer?: string;
  currentStreak?: number;
  bestStreak?: number;
  onMessage?: (userId: string) => void;
}

export function DirectorProfileCard({
  userId,
  displayName,
  avatarUrl,
  coverImageUrl,
  bio,
  publicVision,
  skills,
  lookingFor,
  canOffer,
  currentStreak,
  bestStreak,
  onMessage,
}: DirectorProfileCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasCollaborationInfo = publicVision || (skills && skills.length > 0) || lookingFor || canOffer;

  return (
    <Card className="glass-card cinematic-border overflow-hidden group hover:border-gold/50 transition-all duration-300">
      {/* Cover Image */}
      {coverImageUrl ? (
        <div className="h-24 w-full overflow-hidden">
          <img 
            src={coverImageUrl} 
            alt={`${displayName}'s cover`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-24 w-full bg-gradient-to-br from-purple-900/40 via-gold/20 to-amber-900/40" />
      )}
      
      <CardHeader className="pb-3 -mt-8 relative">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-gold/30 group-hover:border-gold/60 transition-colors ring-2 ring-background">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-gold/30 to-amber-500/30 text-gold font-display text-xl">
                {displayName?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            {currentStreak && currentStreak > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-500 to-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                🔥{currentStreak}
              </div>
            )}
          </div>

          {/* Name & Bio */}
          <div className="flex-1 min-w-0 pt-6">
            <h3 className="font-display text-lg text-gold truncate group-hover:text-gold/90 transition-colors">
              {displayName}
            </h3>
            {bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
            )}
            {bestStreak && bestStreak > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Best streak: {bestStreak} days
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-6">
            {onMessage && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-gold"
                onClick={() => onMessage(userId)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {hasCollaborationInfo && (
        <>
          <CardContent className="pt-0">
            {/* Vision Preview */}
            {publicVision && (
              <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-gold/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300">Their Dream</span>
                </div>
                <p className={cn("text-sm text-foreground/90", !expanded && "line-clamp-2")}>
                  {publicVision}
                </p>
              </div>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(expanded ? skills : skills.slice(0, 4)).map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="secondary" 
                      className="bg-amber-500/20 text-amber-200 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {!expanded && skills.length > 4 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{skills.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expanded && (
              <div className="space-y-3 animate-fade-in">
                {/* Looking For */}
                {lookingFor && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-blue-300">Looking For</span>
                    </div>
                    <p className="text-sm text-foreground/90">{lookingFor}</p>
                  </div>
                )}

                {/* Can Offer */}
                {canOffer && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Handshake className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">Can Offer</span>
                    </div>
                    <p className="text-sm text-foreground/90">{canOffer}</p>
                  </div>
                )}
              </div>
            )}

            {/* Expand/Collapse */}
            {(lookingFor || canOffer || (skills && skills.length > 4) || (publicVision && publicVision.length > 100)) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-muted-foreground hover:text-gold"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show More
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </>
      )}

      {!hasCollaborationInfo && bio && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground italic">
            No collaboration info shared yet
          </p>
        </CardContent>
      )}
    </Card>
  );
}