 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { User, Sparkles, RefreshCw, Loader2, Crown, Circle } from "lucide-react";
 import { CharacterSurvey } from "./CharacterSurvey";
 import { ArchetypeResult } from "./ArchetypeResult";
 import { Archetype, getArchetypeByIdWithLegacy, ARCHETYPES } from "./archetypes";
 import { useToast } from "@/hooks/use-toast";
 import { InfoTooltip } from "@/components/ui/info-tooltip";

interface CharacterProfile {
  archetype: string;
  archetype_score: Record<string, number>;
  survey_responses: Record<string, string>;
  light_shadow_state: string;
}

export function CharacterCentral() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentArchetype, setCurrentArchetype] = useState<Archetype | null>(null);
  const [currentScores, setCurrentScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("character_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading character profile:", error);
    } else if (data) {
      setProfile({
        archetype: data.archetype,
        archetype_score: data.archetype_score as Record<string, number>,
        survey_responses: data.survey_responses as Record<string, string>,
        light_shadow_state: data.light_shadow_state || "light"
      });
      const arch = getArchetypeByIdWithLegacy(data.archetype);
      if (arch) {
        setCurrentArchetype(arch);
        setCurrentScores(data.archetype_score as Record<string, number>);
      }
    }

    setIsLoading(false);
  };

  const handleSurveyComplete = async (
    archetype: Archetype,
    scores: Record<string, number>,
    responses: Record<string, string>
  ) => {
    if (!user) return;

    setCurrentArchetype(archetype);
    setCurrentScores(scores);

    // Save to database
    const { error } = await supabase
      .from("character_profiles")
      .upsert({
        user_id: user.id,
        archetype: archetype.id,
        archetype_score: scores,
        survey_responses: responses,
        light_shadow_state: "light"
      });

    if (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again",
        variant: "destructive"
      });
      console.error("Error saving character profile:", error);
    } else {
      setProfile({
        archetype: archetype.id,
        archetype_score: scores,
        survey_responses: responses,
        light_shadow_state: "light"
      });
      toast({
        title: "Character Profile Saved!",
        description: `You are The ${archetype.name}`,
      });
    }

    setShowSurvey(false);
    setShowResult(true);
  };

 // Toggle light/shadow state - kept for legacy support but simplified
   const toggleLightShadow = async () => {
     // No-op for new Metu Neter system, kept for legacy DB records
   };

  if (isLoading) {
    return (
      <Card className="glass-card cinematic-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // No profile yet - show CTA
  if (!profile || !currentArchetype) {
    return (
      <>
        <Card className="glass-card cinematic-border group hover:border-gold/50 transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-display tracking-wide">Character Central</CardTitle>
                    <InfoTooltip content="Discover your Director archetype through a character survey. Your archetype helps the AI coach you based on your natural strengths and growth areas." />
                  </div>
                  <p className="text-sm text-muted-foreground">Discover your Director archetype</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a quick survey to discover your character archetype. The AI will use this to provide personalized coaching aligned with your natural strengths.
            </p>
            <Button variant="gold" onClick={() => setShowSurvey(true)} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Start Character Survey
            </Button>
          </CardContent>
        </Card>

        {showSurvey && (
          <CharacterSurvey
            onComplete={handleSurveyComplete}
            onClose={() => setShowSurvey(false)}
          />
        )}
      </>
    );
  }

  // Has profile - show summary
  return (
    <>
      <Card className="glass-card cinematic-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-display tracking-wide">Character Central</CardTitle>
                  <InfoTooltip content="Your archetype influences how the Director AI coaches you, aligning guidance with your natural strengths and growth edges." />
                </div>
                <p className="text-sm text-muted-foreground">Your Director archetype</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSurvey(true)}
              className="gap-1 text-muted-foreground hover:text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retake
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
 {/* Archetype Display */}
           <div 
             className="p-4 rounded-lg bg-gradient-to-br from-gold/10 to-amber-500/5 border border-gold/20 cursor-pointer hover:border-gold/40 transition-all"
             onClick={() => setShowResult(true)}
           >
             <div className="flex items-center justify-between mb-2">
               <h3 className="text-xl font-display text-gold">{currentArchetype.name}</h3>
               <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                 Sphere {currentArchetype.sphere}
               </Badge>
             </div>
             <p className="text-xs text-muted-foreground mb-2">{currentArchetype.deity}</p>
             <p className="text-sm text-muted-foreground italic">
               "{currentArchetype.directorsNote}"
             </p>
           </div>

          <p className="text-xs text-muted-foreground text-center">
            Tap to view full archetype details
          </p>
        </CardContent>
      </Card>

      {/* Survey Modal */}
      {showSurvey && (
        <CharacterSurvey
          onComplete={handleSurveyComplete}
          onClose={() => setShowSurvey(false)}
        />
      )}

      {/* Result Modal */}
      {showResult && currentArchetype && (
        <ArchetypeResult
          archetype={currentArchetype}
          scores={currentScores}
          onClose={() => setShowResult(false)}
          onRetake={() => {
            setShowResult(false);
            setShowSurvey(true);
          }}
        />
      )}
    </>
  );
}
