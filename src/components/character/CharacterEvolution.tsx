import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, ArrowRight, Sparkles } from "lucide-react";
 import { ARCHETYPES, getArchetypeByIdWithLegacy } from "./archetypes";
import { format } from "date-fns";

interface CharacterSnapshot {
  id: string;
  archetype: string;
  archetypeScore: Record<string, number>;
  createdAt: Date;
}

interface CharacterEvolutionProps {
  inline?: boolean;
}

export function CharacterEvolution({ inline = false }: CharacterEvolutionProps) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<CharacterSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchEvolution();
  }, [user]);

  const fetchEvolution = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("character_profiles")
        .select("id, archetype, archetype_score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedSnapshots: CharacterSnapshot[] = (data || []).map((profile) => ({
        id: profile.id,
        archetype: profile.archetype,
        archetypeScore: profile.archetype_score as Record<string, number>,
        createdAt: new Date(profile.created_at),
      }));

      setSnapshots(formattedSnapshots);
    } catch (error) {
      console.error("Error fetching character evolution:", error);
    } finally {
      setLoading(false);
    }
  };

  const getArchetypeName = (id: string) => {
    const archetype = getArchetypeByIdWithLegacy(id);
    return archetype?.name || id;
  };

  const getArchetypeSuperpower = (id: string) => {
    const archetype = getArchetypeByIdWithLegacy(id);
    return archetype?.superpower || "";
  };

  const getTopThreeArchetypes = (scores: Record<string, number>) => {
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, score]) => ({ id, score }));
  };

  const calculateShift = (prev: CharacterSnapshot, current: CharacterSnapshot) => {
    if (prev.archetype === current.archetype) {
      return { type: "strengthened", message: "Deepened identity" };
    }
    return { type: "shifted", message: `Evolved from ${getArchetypeName(prev.archetype)}` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card className="bg-card/50 border-gold/20">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-gold/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Character History Yet</h3>
          <p className="text-muted-foreground">
            Complete the Archetype Survey to start tracking your character evolution.
            Each time you retake the survey, your transformation will be recorded here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display text-gold-gradient mb-2">
          Character Evolution Timeline
        </h2>
        <p className="text-muted-foreground">
          Track your identity transformation across {snapshots.length} survey{snapshots.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Evolution Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 border-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gold">{snapshots.length}</div>
            <div className="text-xs text-muted-foreground">Total Surveys</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gold">
              {new Set(snapshots.map(s => s.archetype)).size}
            </div>
            <div className="text-xs text-muted-foreground">Unique Archetypes</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gold">
              {snapshots.length > 0 ? format(snapshots[0].createdAt, "MMM yyyy") : "—"}
            </div>
            <div className="text-xs text-muted-foreground">First Survey</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gold">
              {snapshots.length > 0 ? format(snapshots[snapshots.length - 1].createdAt, "MMM yyyy") : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Latest Survey</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-gold/50 to-gold/20" />

        <div className="space-y-6">
          {snapshots.map((snapshot, index) => {
            const archetype = getArchetypeByIdWithLegacy(snapshot.archetype);
            const topThree = getTopThreeArchetypes(snapshot.archetypeScore);
            const shift = index > 0 ? calculateShift(snapshots[index - 1], snapshot) : null;
            const isLatest = index === snapshots.length - 1;

            return (
              <div key={snapshot.id} className="relative pl-16">
                {/* Timeline Node */}
                <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                  isLatest 
                    ? "bg-gold border-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                    : "bg-background border-gold/50"
                }`}>
                  {isLatest && (
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-gold" />
                  )}
                </div>

                <Card className={`bg-card/50 border-gold/20 ${isLatest ? "ring-1 ring-gold/30" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(snapshot.createdAt, "MMMM d, yyyy")}
                          </span>
                          {isLatest && (
                            <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl text-gold">
                          {getArchetypeName(snapshot.archetype)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground italic">
                          {getArchetypeSuperpower(snapshot.archetype)}
                        </p>
                      </div>

                      {shift && (
                        <Badge 
                          variant="outline" 
                          className={`${
                            shift.type === "shifted" 
                              ? "border-amber-500/50 text-amber-400" 
                              : "border-green-500/50 text-green-400"
                          }`}
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          {shift.message}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Light/Shadow */}
                    {getArchetypeByIdWithLegacy(snapshot.archetype) && (
                      <div className="flex gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">Light:</span>
                          <span className="text-muted-foreground">{getArchetypeByIdWithLegacy(snapshot.archetype)?.lightShadow.light}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400">Shadow:</span>
                          <span className="text-muted-foreground">{getArchetypeByIdWithLegacy(snapshot.archetype)?.lightShadow.shadow}</span>
                        </div>
                      </div>
                    )}

                    {/* Top 3 Scores */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Top Archetype Scores
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {topThree.map((item, i) => {
                          const maxScore = Math.max(...Object.values(snapshot.archetypeScore));
                          const percentage = Math.round((item.score / maxScore) * 100);
                          
                          return (
                            <div 
                              key={item.id} 
                              className="bg-background/50 rounded-lg p-2 text-center"
                            >
                              <div className="text-xs text-muted-foreground mb-1">
                                #{i + 1}
                              </div>
                              <div className="text-sm font-medium text-foreground truncate">
                                {getArchetypeName(item.id)}
                              </div>
                              <div className="text-lg font-bold text-gold">
                                {percentage}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evolution Insight */}
      {snapshots.length >= 2 && (
        <Card className="bg-gradient-to-r from-gold/10 to-transparent border-gold/20 mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gold mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolution Insight
            </h3>
            <p className="text-muted-foreground">
              {snapshots[0].archetype === snapshots[snapshots.length - 1].archetype ? (
                <>
                  You've consistently embodied <span className="text-gold font-medium">
                    {getArchetypeName(snapshots[snapshots.length - 1].archetype)}
                  </span> throughout your journey. This stability shows deep alignment with your core identity.
                </>
              ) : (
                <>
                  Your character has evolved from <span className="text-gold font-medium">
                    {getArchetypeName(snapshots[0].archetype)}
                  </span> to <span className="text-gold font-medium">
                    {getArchetypeName(snapshots[snapshots.length - 1].archetype)}
                  </span>. This transformation reflects your growth and adaptation on your journey.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
