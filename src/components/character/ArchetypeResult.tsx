import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, AlertTriangle, Target, X, Crown, Zap, Sun, Moon, Swords } from "lucide-react";
import { Archetype, ARCHETYPES } from "./archetypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CharacterTransformationCoach } from "./CharacterTransformationCoach";

interface ArchetypeResultProps {
  archetype: Archetype;
  scores: Record<string, number>;
  onClose: () => void;
  onRetake: () => void;
}

export function ArchetypeResult({ archetype, scores, onClose, onRetake }: ArchetypeResultProps) {
  const [showTransformationCoach, setShowTransformationCoach] = useState(false);
  
  // Sort archetypes by score for ranking
  const rankedArchetypes = ARCHETYPES.map(a => ({
    ...a,
    score: scores[a.id] || 0
  })).sort((a, b) => b.score - a.score);

  const topThree = rankedArchetypes.slice(0, 3);
  const maxScore = Math.max(...Object.values(scores), 1);

  if (showTransformationCoach) {
    return (
      <CharacterTransformationCoach
        archetype={archetype}
        scores={scores}
        onClose={() => setShowTransformationCoach(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Close Button */}
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Main Result Card */}
            <Card className="glass-card border-gold/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-500/5" />
              
              <CardHeader className="relative text-center space-y-4 pb-2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center mx-auto shadow-2xl">
                  <Crown className="w-12 h-12 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gold font-medium mb-1">Your Primary Archetype</p>
                  <CardTitle className="text-4xl font-display tracking-wide text-gold-gradient">
                    {archetype.name}
                  </CardTitle>
                  <p className="text-lg text-muted-foreground italic mt-2">
                    "{archetype.tagline}"
                  </p>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6 pt-4">
                {/* Light/Shadow Toggle Visual */}
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                      <Sun className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-xs text-muted-foreground">Light</p>
                    <p className="text-sm font-medium text-amber-500">{archetype.lightShadow.light}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center mx-auto mb-2">
                      <Moon className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">Shadow</p>
                    <p className="text-sm font-medium text-slate-400">{archetype.lightShadow.shadow}</p>
                  </div>
                </div>

                {/* Strengths */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium">Strengths</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {archetype.strengths.map((strength, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h4 className="font-medium">Growth Areas</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {archetype.weaknesses.map((weakness, i) => (
                      <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Story Fuel */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-primary">Your Story Fuel</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{archetype.storyFuel}</p>
                </div>

                {/* Social Correspondence */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium">Where You Thrive</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {archetype.socialCorrespondence.map((role, i) => (
                      <li key={i}>• {role}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Archetype Ranking */}
            <Card className="glass-card cinematic-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gold" />
                  Your Archetype Profile
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your top 3 character influences
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {topThree.map((arch, index) => (
                  <div key={arch.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          index === 0 ? "text-gold" : index === 1 ? "text-slate-400" : "text-amber-700"
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="font-medium">{arch.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((arch.score / maxScore) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          index === 0 ? "bg-gold" : index === 1 ? "bg-slate-400" : "bg-amber-700"
                        }`}
                        style={{ width: `${(arch.score / maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Character Signature */}
            <Card className="glass-card cinematic-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display tracking-wide">
                  Your Character Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Dialogue Style</p>
                    <p className="text-sm">{archetype.signature.dialogueStyle}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Physical Presence</p>
                    <p className="text-sm">{archetype.signature.physicalPresence}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Moral Temptation</p>
                    <p className="text-sm">{archetype.signature.moralTemptation}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Break Point</p>
                    <p className="text-sm">{archetype.signature.breakPoint}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gold/10 border border-gold/20">
                  <p className="text-xs text-gold mb-1">Your Redemption Arc</p>
                  <p className="text-sm font-medium">{archetype.signature.redemptionBeat}</p>
                </div>
              </CardContent>
            </Card>

            {/* Transformation Coach CTA */}
            <Card className="glass-card border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5">
              <CardContent className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto">
                  <Swords className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg">Who Must You Become?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get AI-powered analysis of the character transformation required to achieve your Chief Aim.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowTransformationCoach(true)}
                  className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  <Target className="h-4 w-4" />
                  Reveal My Required Character
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center gap-4 pb-8">
              <Button variant="outline" onClick={onRetake}>
                Retake Survey
              </Button>
              <Button variant="gold" onClick={onClose}>
                Continue as {archetype.name}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
