import { User, Target, Sparkles, AlertTriangle, RefreshCw, Quote, ArrowRight, Sunrise, Sun, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface EpisodeCharacterTransformation {
  requiredCharacter: {
    name: string;
    traits: string[];
    behaviors: string[];
    mindset: string;
  };
  currentCharacterProfile?: {
    limitingBeliefs: string[];
    sabotagePatterns: string[];
  };
  transformationGap: {
    whatMustDie: string[];
    whatMustEmerge: string[];
  };
  narrativeArc?: {
    midpointConflict: string;
    climacticShift: string;
    resolution: string;
  };
  dailyPractice?: {
    morningActivation: string;
    midDayReset: string;
    eveningReflection: string;
    mantra: string;
  };
  chiefAimConnection?: string;
}

interface EpisodeTransformationCardProps {
  transformation: EpisodeCharacterTransformation;
  variant?: "compact" | "full";
}

export function EpisodeTransformationCard({ transformation, variant = "compact" }: EpisodeTransformationCardProps) {
  const { requiredCharacter, currentCharacterProfile, transformationGap, narrativeArc, dailyPractice, chiefAimConnection } = transformation;

  if (variant === "compact") {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-600/5">
        <CardContent className="p-4 space-y-3">
          {/* Character Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Required Character</p>
              <p className="font-display text-gold">{requiredCharacter.name}</p>
            </div>
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-1.5">
            {requiredCharacter.traits.slice(0, 4).map((trait, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {trait}
              </Badge>
            ))}
          </div>

          {/* Mantra */}
          {dailyPractice?.mantra && (
            <div className="p-2 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Daily Mantra</p>
              <p className="text-sm italic">"{dailyPractice.mantra}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Required Character Section */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-600/5">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">The Character You Must Become</p>
              <h3 className="text-xl font-display text-gold">{requiredCharacter.name}</h3>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Traits & Behaviors Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Core Traits
              </p>
              <div className="flex flex-wrap gap-1.5">
                {requiredCharacter.traits.map((trait, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                Daily Behaviors
              </p>
              <ul className="space-y-1">
                {requiredCharacter.behaviors.map((behavior, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    {behavior}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mindset */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Required Mindset</p>
            <p className="text-sm">{requiredCharacter.mindset}</p>
          </div>
        </CardContent>
      </Card>

      {/* Transformation Gap */}
      <Card className="border-border">
        <CardContent className="p-5 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            The Transformation Gap
          </h4>

          <div className="grid md:grid-cols-2 gap-4">
            {/* What Must Die */}
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-sm font-medium text-red-400 mb-3">What Must Die</p>
              <ul className="space-y-2">
                {transformationGap.whatMustDie.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What Must Emerge */}
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm font-medium text-green-400 mb-3">What Must Emerge</p>
              <ul className="space-y-2">
                {transformationGap.whatMustEmerge.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current Character Blocks */}
          {currentCharacterProfile && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Watch For These Patterns
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Limiting Beliefs</p>
                  {currentCharacterProfile.limitingBeliefs.map((belief, i) => (
                    <p key={i} className="text-sm text-amber-500/80">• {belief}</p>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sabotage Patterns</p>
                  {currentCharacterProfile.sabotagePatterns.map((pattern, i) => (
                    <p key={i} className="text-sm text-amber-500/80">• {pattern}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Narrative Arc */}
      {narrativeArc && (
        <Card className="border-border">
          <CardContent className="p-5 space-y-4">
            <h4 className="font-medium">The Story Within This Episode</h4>

            <div className="space-y-4">
              {/* Midpoint Conflict */}
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs font-medium text-amber-500 mb-2">MIDPOINT CONFLICT</p>
                <p className="text-sm">{narrativeArc.midpointConflict}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  This is when you'll be tempted to solve things the OLD way...
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Climactic Shift */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-medium text-primary mb-2">CLIMACTIC SHIFT</p>
                <p className="text-sm">{narrativeArc.climacticShift}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  The moment you choose transformation over comfort...
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Resolution */}
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <p className="text-xs font-medium text-green-400 mb-2">RESOLUTION</p>
                <p className="text-sm">{narrativeArc.resolution}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Practice */}
      {dailyPractice && (
        <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="p-5 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Quote className="w-4 h-4 text-gold" />
              Daily Transformation Practice
            </h4>

            {/* Mantra */}
            <div className="text-center p-4 rounded-lg bg-gold/5 border border-gold/20">
              <p className="text-lg font-display text-gold italic">
                "{dailyPractice.mantra}"
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sunrise className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-medium">Morning</p>
                </div>
                <p className="text-sm text-muted-foreground">{dailyPractice.morningActivation}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-gold" />
                  <p className="text-xs font-medium">Midday</p>
                </div>
                <p className="text-sm text-muted-foreground">{dailyPractice.midDayReset}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-medium">Evening</p>
                </div>
                <p className="text-sm text-muted-foreground">{dailyPractice.eveningReflection}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chief Aim Connection */}
      {chiefAimConnection && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Connection to Your Definite Chief Aim</p>
          <p className="text-sm">{chiefAimConnection}</p>
        </div>
      )}
    </div>
  );
}
