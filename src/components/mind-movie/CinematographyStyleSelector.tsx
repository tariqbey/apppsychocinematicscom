import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Video, Sun, Sparkles, Moon, Camera, Film, Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CinematographyStyle {
  value: string;
  label: string;
  description: string;
  icon: React.ElementType;
  lighting: string;
  cameraWork: string;
  mood: string;
  colorPalette: string;
}

export const CINEMATOGRAPHY_STYLES: CinematographyStyle[] = [
  {
    value: "dramatic",
    label: "Dramatic",
    description: "Bold shadows, powerful angles",
    icon: Moon,
    lighting: "Chiaroscuro lighting with dramatic shadows, rim lights for subject separation, low-key lighting for intensity",
    cameraWork: "Low angle shots for power, Dutch angles for transformation, push-in dolly for revelation moments",
    mood: "Intense, commanding, authoritative, triumphant",
    colorPalette: "Deep blacks, golden highlights, rich amber accents, high contrast"
  },
  {
    value: "warm",
    label: "Warm & Inviting",
    description: "Golden hour, soft textures",
    icon: Sun,
    lighting: "Golden hour warmth, soft diffused light, practical lighting from natural sources, warm color temperature",
    cameraWork: "Eye-level intimate shots, steadicam following, medium shots for connection, gentle orbits",
    mood: "Nurturing, abundant, welcoming, prosperous, grateful",
    colorPalette: "Warm golds, honey tones, soft ambers, creamy highlights, earth tones"
  },
  {
    value: "ethereal",
    label: "Ethereal & Dreamy",
    description: "Mystical glow, soft focus",
    icon: Sparkles,
    lighting: "Blue hour ethereal glow, soft backlighting with lens flares, diffused magical light, rim lighting halos",
    cameraWork: "Crane shots ascending, slow push-ins, centered symmetry for power, wide establishing shots",
    mood: "Transcendent, spiritual, unlimited, visionary, connected",
    colorPalette: "Soft blues, lavender, silver highlights, pastel accents, luminous whites"
  },
  {
    value: "cinematic-noir",
    label: "Cinematic Noir",
    description: "Classic film, mystery & depth",
    icon: Film,
    lighting: "Strong single-source lighting, deep shadows, venetian blind patterns, silhouette work",
    cameraWork: "Dutch angles for tension, extreme close-ups for emotion, low angles for dominance",
    mood: "Mysterious, sophisticated, determined, resilient",
    colorPalette: "Black and white with gold accents, silver tones, minimal color, high contrast"
  },
  {
    value: "vibrant-energy",
    label: "Vibrant Energy",
    description: "Dynamic, high-impact visuals",
    icon: Flame,
    lighting: "High-key bright lighting, multiple colored light sources, energetic rim lights, dynamic practical lights",
    cameraWork: "Fast push-ins, dynamic steadicam movement, low-to-high crane reveals, orbit shots",
    mood: "Energetic, unstoppable, explosive, victorious, magnetic",
    colorPalette: "Bold oranges, electric blues, vivid magentas, saturated colors, neon accents"
  },
  {
    value: "nature-organic",
    label: "Nature & Organic",
    description: "Natural light, earthly textures",
    icon: Camera,
    lighting: "Natural daylight, dappled sunlight through leaves, overcast soft light, sunrise/sunset transitions",
    cameraWork: "Wide landscape shots, steady medium shots, gentle following movements, 180-degree rule adherence",
    mood: "Grounded, authentic, balanced, flowing, harmonious",
    colorPalette: "Forest greens, earth browns, sky blues, natural wood tones, organic textures"
  }
];

interface CinematographyStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CinematographyStyleSelector({ value, onChange }: CinematographyStyleSelectorProps) {
  const selectedStyle = CINEMATOGRAPHY_STYLES.find(s => s.value === value);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5 text-primary" />
        <Label className="text-base font-semibold">Cinematography Style</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Pro
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Professional cinematography techniques will be applied to every scene, 
              including specific camera angles, lighting direction, and visual composition.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {CINEMATOGRAPHY_STYLES.map((style) => {
          const Icon = style.icon;
          return (
            <TooltipProvider key={style.value}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Label
                    htmlFor={`cinematography-${style.value}`}
                    className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      value === style.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={style.value}
                      id={`cinematography-${style.value}`}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${value === style.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium">{style.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {style.description}
                    </span>
                  </Label>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm p-3">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-primary">Lighting: </span>
                      <span className="text-muted-foreground">{style.lighting}</span>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Camera: </span>
                      <span className="text-muted-foreground">{style.cameraWork}</span>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Mood: </span>
                      <span className="text-muted-foreground">{style.mood}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </RadioGroup>

      {/* Selected Style Details */}
      {selectedStyle && (
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <selectedStyle.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{selectedStyle.label} Style</h4>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-medium w-16 shrink-0">Lighting:</span>
                    <span className="text-muted-foreground">{selectedStyle.lighting}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-medium w-16 shrink-0">Camera:</span>
                    <span className="text-muted-foreground">{selectedStyle.cameraWork}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-medium w-16 shrink-0">Colors:</span>
                    <span className="text-muted-foreground">{selectedStyle.colorPalette}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
