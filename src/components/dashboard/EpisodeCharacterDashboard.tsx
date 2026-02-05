import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Episode, useEpisodes } from "@/hooks/useEpisodes";
import { EpisodeCharacterTransformation, EpisodeTransformationCard } from "@/components/episodes/EpisodeTransformationCard";
import { User, Target, Zap, Calendar, ChevronDown, ChevronUp, Sparkles, Brain, RefreshCw, Loader2 } from "lucide-react";
import { CharacterCheckInModal } from "./CharacterCheckInModal";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

interface EpisodeCharacterDashboardProps {
  episode: Episode;
  onRegenerateComplete?: () => void;
}

export function EpisodeCharacterDashboard({ episode, onRegenerateComplete }: EpisodeCharacterDashboardProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { updateEpisode, fetchEpisodes } = useEpisodes();
  const [expanded, setExpanded] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const transformation = episode.character_transformation as unknown as EpisodeCharacterTransformation | null;
  
  const daysRemaining = differenceInDays(new Date(episode.deadline), new Date());
  const daysTotal = differenceInDays(new Date(episode.deadline), new Date(episode.created_at));
  const progress = Math.min(100, Math.max(0, ((daysTotal - daysRemaining) / daysTotal) * 100));

  const handleRegenerate = async () => {
    if (!user || !profile) return;
    
    setRegenerating(true);
    try {
      const chiefAim = {
        what: profile.chief_aim_what || "",
        byWhen: profile.chief_aim_by_when || "",
        exchange: profile.chief_aim_exchange || "",
        plan: profile.chief_aim_plan || ""
      };
      
      // Get current archetype
      const { data: characterProfile } = await supabase
        .from("character_profiles")
        .select("archetype")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      const { data, error } = await supabase.functions.invoke("analyze-episode-character", {
        body: {
          episodeObjective: episode.objective,
          chiefAim,
          archetype: characterProfile?.archetype || null
        }
      });
      
      if (error) throw error;
      
      // Update episode with new character transformation
      await updateEpisode(episode.id, {
        character_transformation: data
      });
      
      await fetchEpisodes();
      toast.success("Character profile regenerated!");
      onRegenerateComplete?.();
    } catch (error) {
      console.error("Error regenerating character:", error);
      toast.error("Failed to regenerate character profile");
    } finally {
      setRegenerating(false);
    }
  };

  if (!transformation) {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-orange-600/5">
        <CardContent className="p-6 text-center">
          <User className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No character profile generated yet</p>
          <Button 
            variant="gold" 
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Character Profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-orange-600/5 animate-slide-up overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display text-gold">Episode Character</span>
                <p className="text-xs text-muted-foreground font-normal">
                  {transformation.requiredCharacter.name}
                </p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="gap-2"
                title="Regenerate character profile with updated information"
              >
                {regenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => setShowCheckIn(true)}
                className="gap-2"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Check-In</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Episode Info Bar */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">{episode.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {daysRemaining > 0 ? `${daysRemaining} days left` : "Deadline passed"}
              </span>
            </div>
            {episode.alignment_score && (
              <Badge variant="outline" className="border-gold/50 text-gold">
                {episode.alignment_score}% aligned
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Episode Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Compact View */}
          {!expanded && (
            <div className="space-y-3">
              {/* Traits */}
              <div className="flex flex-wrap gap-1.5">
                {transformation.requiredCharacter.traits.slice(0, 4).map((trait, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
                {transformation.requiredCharacter.traits.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{transformation.requiredCharacter.traits.length - 4} more
                  </Badge>
                )}
              </div>

              {/* Daily Mantra */}
              {transformation.dailyPractice?.mantra && (
                <div className="p-3 rounded-lg bg-gold/5 border border-gold/20">
                  <p className="text-xs text-muted-foreground mb-1">Today's Mantra</p>
                  <p className="text-sm italic text-gold">
                    "{transformation.dailyPractice.mantra}"
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(true)}
                  className="flex-1 text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  View Full Profile
                </Button>
              </div>
            </div>
          )}

          {/* Expanded View */}
          {expanded && (
            <div className="pt-2 animate-fade-in">
              <EpisodeTransformationCard transformation={transformation} variant="full" />
            </div>
          )}
        </CardContent>
      </Card>

      <CharacterCheckInModal open={showCheckIn} onOpenChange={setShowCheckIn} />
    </>
  );
}