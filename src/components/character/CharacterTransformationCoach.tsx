import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, Sparkles, AlertTriangle, ArrowRight, Crown, Swords, Shield, X, Film, Clapperboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Archetype, ARCHETYPES } from "./archetypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
interface TransformationAnalysis {
  currentSelf: {
    archetype: string;
    strengths: string[];
    liabilities: string[];
    blindSpots: string[];
  };
  requiredCharacter: {
    name: string;
    traits: string[];
    behaviors: string[];
    mindset: string;
  };
  gap: {
    whatMustDie: string[];
    whatMustEmerge: string[];
    dailyPractices: string[];
  };
  script: {
    role: string;
    motivation: string;
    arc: string;
  };
}

interface CharacterTransformationCoachProps {
  archetype?: Archetype;
  scores?: Record<string, number>;
  onClose?: () => void;
  inline?: boolean;
  onCreateMindMovie?: (analysis: TransformationAnalysis, chiefAim: { what: string | null; byWhen: string | null; exchange: string | null; plan: string | null }) => void;
}

export function CharacterTransformationCoach({ 
  archetype: archetypeProp, 
  scores: scoresProp, 
  onClose,
  inline = false,
  onCreateMindMovie
}: CharacterTransformationCoachProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<TransformationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!archetypeProp);
  const [archetype, setArchetype] = useState<Archetype | null>(archetypeProp || null);
  const [scores, setScores] = useState<Record<string, number>>(scoresProp || {});
  const [chiefAim, setChiefAim] = useState<{
    what: string | null;
    byWhen: string | null;
    exchange: string | null;
    plan: string | null;
  } | null>(null);

  // Fetch archetype and scores from database if not provided
  useEffect(() => {
    const fetchArchetypeData = async () => {
      if (!user || archetypeProp) {
        setLoadingData(false);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from("character_profiles")
          .select("archetype, archetype_score, transformation_analysis")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (profileData) {
          const foundArchetype = ARCHETYPES.find(a => a.id === profileData.archetype);
          if (foundArchetype) {
            setArchetype(foundArchetype);
            setScores(profileData.archetype_score as Record<string, number> || {});
          }
          if (profileData.transformation_analysis) {
            setAnalysis(profileData.transformation_analysis as unknown as TransformationAnalysis);
          }
        }
      } catch (error) {
        console.error("Error fetching archetype data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchArchetypeData();
  }, [user, archetypeProp]);

  const generateTransformationPlan = async () => {
    if (!user || !archetype) return;
    
    setIsLoading(true);
    
    try {
      // Fetch user's chief aim
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan, display_name")
        .eq("user_id", user.id)
        .single();

      if (!profileData?.chief_aim_what) {
        toast.error("You need to define your Definite Chief Aim first to get transformation guidance.");
        setIsLoading(false);
        return;
      }

      setChiefAim({
        what: profileData.chief_aim_what,
        byWhen: profileData.chief_aim_by_when,
        exchange: profileData.chief_aim_exchange,
        plan: profileData.chief_aim_plan
      });

      // Call AI to generate the transformation analysis
      const { data, error } = await supabase.functions.invoke("analyze-character-transformation", {
        body: {
          archetype: {
            id: archetype.id,
            name: archetype.name,
            strengths: archetype.strengths,
            weaknesses: archetype.weaknesses,
            lightShadow: archetype.lightShadow,
            storyFuel: archetype.storyFuel,
            conflictPattern: archetype.conflictPattern
          },
          archetypeScores: scores,
          chiefAim: {
            what: profileData.chief_aim_what,
            byWhen: profileData.chief_aim_by_when,
            exchange: profileData.chief_aim_exchange,
            plan: profileData.chief_aim_plan
          },
          userName: profileData.display_name
        }
      });

      if (error) throw error;
      
      setAnalysis(data.analysis);
      
      // Save the transformation analysis to character_profiles for Director AI access
      await supabase
        .from("character_profiles")
        .update({ transformation_analysis: data.analysis })
        .eq("user_id", user.id);
        
    } catch (error) {
      console.error("Error generating transformation plan:", error);
      toast.error("Failed to generate transformation analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-gold mb-4" />
          <p className="text-muted-foreground">Loading character data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!archetype) {
    return (
      <Card className="glass-card border-amber-500/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Archetype Found</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            Complete the Character Survey in the Archetype tab first to discover your Director type.
          </p>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className={inline ? "space-y-6" : "min-h-screen py-8 px-4"}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Close Button - only show in modal mode */}
        {!inline && onClose && (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

            {!analysis && !isLoading && (
              <Card className="glass-card border-gold/50">
                <CardHeader className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto">
                    <Target className="w-10 h-10 text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-display tracking-wide">
                      Character Transformation Analysis
                    </CardTitle>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Based on your archetype profile and Definite Chief Aim, discover who you must become to achieve your Final Scene.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-gold" />
                      Current Archetype: {archetype.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      The AI will analyze the gap between who you are now and who you need to become.
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      "It's like going out for a role in a movie. Here's the script. This is the character you must become for the Oscar-winning performance."
                    </p>
                    <Button 
                      onClick={generateTransformationPlan}
                      className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                      size="lg"
                    >
                      <Sparkles className="h-4 w-4" />
                      Reveal My Required Character
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-gold mb-4" />
                  <p className="text-muted-foreground">Analyzing your character transformation path...</p>
                  <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <>
                {/* The Script Header */}
                <Card className="glass-card border-gold/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />
                  <CardHeader className="relative text-center pb-2">
                    <p className="text-xs text-gold font-medium mb-2">YOUR CASTING CALL</p>
                    <CardTitle className="text-3xl font-display tracking-wide text-gold-gradient">
                      The Role: {analysis.requiredCharacter.name}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                      To achieve your Final Scene, this is who you must become.
                    </p>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <div className="p-4 rounded-lg bg-black/20 border border-gold/20">
                      <p className="text-sm font-medium text-gold mb-1">The Script</p>
                      <p className="text-lg italic">"{analysis.script.role}"</p>
                      <p className="text-sm text-muted-foreground mt-2">{analysis.script.motivation}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Your arc:</p>
                      <p className="text-sm font-medium">{analysis.script.arc}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Self Analysis */}
                <Card className="glass-card cinematic-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
                      <Shield className="h-5 w-5 text-slate-400" />
                      Who You Are Now: The {analysis.currentSelf.archetype}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-green-500 font-medium mb-2">ASSETS (Use These)</p>
                      <ul className="space-y-1">
                        {analysis.currentSelf.strengths.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-red-400 font-medium mb-2">LIABILITIES (These Will Sabotage You)</p>
                      <ul className="space-y-1">
                        {analysis.currentSelf.liabilities.map((l, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-red-400 mt-1">✗</span>
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-amber-500 font-medium mb-2">BLIND SPOTS (You Won't See These Coming)</p>
                      <ul className="space-y-1">
                        {analysis.currentSelf.blindSpots.map((b, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Required Character */}
                <Card className="glass-card border-gold/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
                      <Crown className="h-5 w-5 text-gold" />
                      The Character You Must Become
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      This is not optional. Your Chief Aim demands this transformation.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
                      <p className="text-xs text-gold font-medium mb-2">REQUIRED MINDSET</p>
                      <p className="text-sm">{analysis.requiredCharacter.mindset}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gold font-medium mb-2">CHARACTER TRAITS TO EMBODY</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.requiredCharacter.traits.map((t, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-gold/10 text-gold text-sm border border-gold/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gold font-medium mb-2">DAILY BEHAVIORS (Non-Negotiable)</p>
                      <ul className="space-y-2">
                        {analysis.requiredCharacter.behaviors.map((b, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* The Gap - What Must Change */}
                <Card className="glass-card cinematic-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
                      <Swords className="h-5 w-5 text-red-400" />
                      The Transformation Gap
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      The old you cannot achieve the new goal. Here's what changes.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                        <p className="text-xs text-red-400 font-medium mb-2">WHAT MUST DIE</p>
                        <ul className="space-y-2">
                          {analysis.gap.whatMustDie.map((d, i) => (
                            <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                              <span className="text-red-500">💀</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                        <p className="text-xs text-green-400 font-medium mb-2">WHAT MUST EMERGE</p>
                        <ul className="space-y-2">
                          {analysis.gap.whatMustEmerge.map((e, i) => (
                            <li key={i} className="text-sm text-green-300 flex items-start gap-2">
                              <span className="text-green-500">🌱</span>
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary font-medium mb-2">DAILY PRACTICES FOR TRANSFORMATION</p>
                      <ul className="space-y-2">
                        {analysis.gap.dailyPractices.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary font-bold">{i + 1}.</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Chief Aim Reference */}
                {chiefAim && (
                  <Card className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-display tracking-wide">
                        Your Final Scene
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground italic">"{chiefAim.what}"</p>
                      {chiefAim.byWhen && (
                        <p className="text-xs text-gold mt-2">By: {chiefAim.byWhen}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Create Your Transformation Script CTA */}
                <Card className="glass-card border-2 border-gold/50 bg-gradient-to-br from-gold/10 via-transparent to-amber-500/10 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
                  <CardHeader className="relative text-center pb-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-amber-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Clapperboard className="w-8 h-8 text-gold" />
                    </div>
                    <CardTitle className="text-2xl font-display tracking-wide text-gold-gradient">
                      Now, Let's Write Your Script
                    </CardTitle>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      You know who you need to become. Now let's create the cinematic scenes and affirmations 
                      that will burn this new identity into your subconscious.
                    </p>
                  </CardHeader>
                  <CardContent className="relative space-y-4 text-center">
                    <div className="p-4 rounded-lg bg-black/20 border border-gold/20 max-w-lg mx-auto">
                      <p className="text-sm text-muted-foreground">
                        The AI will craft a visual screenplay featuring <span className="text-gold font-medium">{analysis.requiredCharacter.name}</span> — 
                        scenes that show you embodying each required trait, affirmations that sound like your character's 
                        confident inner voice, and a triumphant finale that shows your complete transformation.
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="gap-3 bg-gradient-to-r from-gold via-amber-500 to-gold hover:from-amber-500 hover:via-gold hover:to-amber-500 text-black font-semibold shadow-lg shadow-gold/25 hover:shadow-gold/40 transition-all duration-300"
                      onClick={() => {
                        if (onCreateMindMovie && chiefAim) {
                          onCreateMindMovie(analysis, chiefAim);
                        } else {
                          // Store the transformation analysis in sessionStorage and navigate
                          sessionStorage.setItem('transformationAnalysis', JSON.stringify(analysis));
                          sessionStorage.setItem('chiefAimForScript', JSON.stringify(chiefAim));
                          navigate('/?openWizard=true');
                          toast.success("Opening Mind Movie Script Wizard...");
                        }
                      }}
                    >
                      <Film className="h-5 w-5" />
                      Create Your Transformation Script
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      This will open the Mind Movie Wizard with your character transformation pre-loaded
                    </p>
                  </CardContent>
                </Card>

                {/* Bottom Quote */}
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground italic max-w-lg mx-auto">
                    "At the end of the day, the goal is just the carrot on a stick. The real goal is the character modification. 
                    Who did you have to become to achieve that objective? Because when you pass away, those things do not go with you. 
                    The only thing that goes with you is your character."
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 pb-8">
                  {onClose && (
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                  )}
                  <Button variant="gold" onClick={generateTransformationPlan}>
                    Regenerate Analysis
                  </Button>
                </div>
              </>
            )}
        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-hidden">
      <ScrollArea className="h-full">
        {content}
      </ScrollArea>
    </div>
  );
}