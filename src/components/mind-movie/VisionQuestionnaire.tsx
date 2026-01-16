import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target, 
  Car, 
  Home, 
  User, 
  Sparkles, 
  Briefcase,
  Heart,
  Globe,
  Trophy,
  Crown,
  Dumbbell,
  Palette
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface VisionAnswers {
  // Goal/Objective
  primaryObjective: string;
  successMetric: string;
  
  // Lifestyle
  dreamCar: string;
  livingEnvironment: string;
  travelDestinations: string;
  
  // Physical Appearance
  physicalState: string;
  wardrobeStyle: string;
  energyLevel: string;
  
  // Character & Identity
  characterTraits: string[];
  howOthersDescribe: string;
  dailyMindset: string;
  
  // Actions & Activities
  primaryActivities: string[];
  keyMoments: string;
  
  // Additional Context
  additionalDetails: string;
}

interface VisionQuestionnaireProps {
  answers: VisionAnswers;
  onChange: (answers: VisionAnswers) => void;
  transformationAnalysis?: {
    requiredCharacter?: {
      name?: string;
      traits?: string[];
      behaviors?: string[];
    };
  };
}

const CHARACTER_TRAITS = [
  "Confident",
  "Disciplined", 
  "Charismatic",
  "Focused",
  "Resilient",
  "Visionary",
  "Compassionate",
  "Decisive",
  "Calm under pressure",
  "Fearless",
  "Authentic",
  "Magnetic",
];

const PRIMARY_ACTIVITIES = [
  "Speaking on stage",
  "Leading a team",
  "Closing deals",
  "Creating content",
  "Building products",
  "Mentoring others",
  "Traveling the world",
  "Spending time with family",
  "Working out",
  "Making investments",
  "Celebrating wins",
  "Living luxuriously",
];

const LIVING_ENVIRONMENTS = [
  { value: "luxury-penthouse", label: "Luxury Penthouse", description: "High-rise city views" },
  { value: "modern-mansion", label: "Modern Mansion", description: "Sleek contemporary estate" },
  { value: "beach-villa", label: "Beach Villa", description: "Oceanfront paradise" },
  { value: "mountain-retreat", label: "Mountain Retreat", description: "Peaceful nature escape" },
  { value: "urban-loft", label: "Urban Loft", description: "Trendy city living" },
  { value: "custom", label: "Custom", description: "Describe your own" },
];

const WARDROBE_STYLES = [
  { value: "power-executive", label: "Power Executive", description: "Tailored suits, commanding presence" },
  { value: "luxury-casual", label: "Luxury Casual", description: "High-end relaxed elegance" },
  { value: "creative-visionary", label: "Creative Visionary", description: "Unique, artistic expression" },
  { value: "athletic-elite", label: "Athletic Elite", description: "Premium activewear, peak fitness" },
  { value: "timeless-classic", label: "Timeless Classic", description: "Sophisticated, never goes out of style" },
  { value: "custom", label: "Custom", description: "Describe your own" },
];

const ENERGY_LEVELS = [
  { value: "calm-powerful", label: "Calm & Powerful", description: "Steady, grounded confidence" },
  { value: "high-energy", label: "High Energy", description: "Dynamic, electric presence" },
  { value: "zen-focused", label: "Zen & Focused", description: "Peaceful mastery" },
  { value: "magnetic-charismatic", label: "Magnetic & Charismatic", description: "Draws people in naturally" },
];

export function VisionQuestionnaire({ 
  answers, 
  onChange,
  transformationAnalysis 
}: VisionQuestionnaireProps) {
  const [customLiving, setCustomLiving] = useState("");
  const [customWardrobe, setCustomWardrobe] = useState("");

  const updateAnswer = <K extends keyof VisionAnswers>(
    key: K, 
    value: VisionAnswers[K]
  ) => {
    onChange({ ...answers, [key]: value });
  };

  const toggleTrait = (trait: string) => {
    const current = answers.characterTraits || [];
    const updated = current.includes(trait)
      ? current.filter(t => t !== trait)
      : [...current, trait];
    updateAnswer("characterTraits", updated);
  };

  const toggleActivity = (activity: string) => {
    const current = answers.primaryActivities || [];
    const updated = current.includes(activity)
      ? current.filter(a => a !== activity)
      : [...current, activity];
    updateAnswer("primaryActivities", updated);
  };

  // Pre-populate traits from transformation analysis if available
  const suggestedTraits = transformationAnalysis?.requiredCharacter?.traits || [];

  return (
    <div className="space-y-8">
      {/* Section 1: Your Objective */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Your Vision & Objective</h3>
        </div>
        
        <div className="grid gap-4 pl-10">
          <div className="space-y-2">
            <Label htmlFor="primaryObjective">
              What is the main goal you're manifesting?
            </Label>
            <Textarea
              id="primaryObjective"
              placeholder="Example: Building a $10M company, achieving financial freedom, becoming a bestselling author..."
              value={answers.primaryObjective || ""}
              onChange={(e) => updateAnswer("primaryObjective", e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="successMetric">
              How will you know when you've achieved it?
            </Label>
            <Input
              id="successMetric"
              placeholder="Example: Revenue hits 8 figures, speaking at major conferences, featured in Forbes..."
              value={answers.successMetric || ""}
              onChange={(e) => updateAnswer("successMetric", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Lifestyle Vision */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold">Your Lifestyle</h3>
        </div>
        
        <div className="grid gap-4 pl-10">
          <div className="space-y-2">
            <Label htmlFor="dreamCar" className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              What car are you driving?
            </Label>
            <Input
              id="dreamCar"
              placeholder="Example: Matte black Rolls Royce, Tesla Model S Plaid, Porsche 911 Turbo..."
              value={answers.dreamCar || ""}
              onChange={(e) => updateAnswer("dreamCar", e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Home className="w-4 h-4 text-muted-foreground" />
              Where do you live?
            </Label>
            <RadioGroup
              value={answers.livingEnvironment || ""}
              onValueChange={(val) => updateAnswer("livingEnvironment", val)}
              className="grid grid-cols-2 md:grid-cols-3 gap-2"
            >
              {LIVING_ENVIRONMENTS.map((env) => (
                <Label
                  key={env.value}
                  htmlFor={`env-${env.value}`}
                  className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                    answers.livingEnvironment === env.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem 
                    value={env.value} 
                    id={`env-${env.value}`} 
                    className="sr-only" 
                  />
                  <span className="font-medium">{env.label}</span>
                  <span className="text-xs text-muted-foreground">{env.description}</span>
                </Label>
              ))}
            </RadioGroup>
            {answers.livingEnvironment === "custom" && (
              <Input
                placeholder="Describe your dream living environment..."
                value={customLiving}
                onChange={(e) => {
                  setCustomLiving(e.target.value);
                  updateAnswer("livingEnvironment", `custom: ${e.target.value}`);
                }}
                className="mt-2"
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="travelDestinations">
              Where are you traveling to?
            </Label>
            <Input
              id="travelDestinations"
              placeholder="Example: Private jet to Dubai, yacht in Monaco, villa in Bali..."
              value={answers.travelDestinations || ""}
              onChange={(e) => updateAnswer("travelDestinations", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Physical Appearance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold">Your Physical Presence</h3>
        </div>
        
        <div className="grid gap-4 pl-10">
          <div className="space-y-2">
            <Label htmlFor="physicalState">
              What physical condition are you in?
            </Label>
            <Input
              id="physicalState"
              placeholder="Example: Peak fitness, athletic build, glowing skin, well-rested, radiating health..."
              value={answers.physicalState || ""}
              onChange={(e) => updateAnswer("physicalState", e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              How are you dressed?
            </Label>
            <RadioGroup
              value={answers.wardrobeStyle || ""}
              onValueChange={(val) => updateAnswer("wardrobeStyle", val)}
              className="grid grid-cols-2 md:grid-cols-3 gap-2"
            >
              {WARDROBE_STYLES.map((style) => (
                <Label
                  key={style.value}
                  htmlFor={`style-${style.value}`}
                  className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                    answers.wardrobeStyle === style.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem 
                    value={style.value} 
                    id={`style-${style.value}`} 
                    className="sr-only" 
                  />
                  <span className="font-medium">{style.label}</span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </Label>
              ))}
            </RadioGroup>
            {answers.wardrobeStyle === "custom" && (
              <Input
                placeholder="Describe your signature style..."
                value={customWardrobe}
                onChange={(e) => {
                  setCustomWardrobe(e.target.value);
                  updateAnswer("wardrobeStyle", `custom: ${e.target.value}`);
                }}
                className="mt-2"
              />
            )}
          </div>
          
          <div className="space-y-3">
            <Label>What energy do you carry?</Label>
            <RadioGroup
              value={answers.energyLevel || ""}
              onValueChange={(val) => updateAnswer("energyLevel", val)}
              className="grid grid-cols-2 gap-2"
            >
              {ENERGY_LEVELS.map((level) => (
                <Label
                  key={level.value}
                  htmlFor={`energy-${level.value}`}
                  className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                    answers.energyLevel === level.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem 
                    value={level.value} 
                    id={`energy-${level.value}`} 
                    className="sr-only" 
                  />
                  <span className="font-medium">{level.label}</span>
                  <span className="text-xs text-muted-foreground">{level.description}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Section 4: Character & Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold">Your Character</h3>
          {transformationAnalysis?.requiredCharacter?.name && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                    From Analysis
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Based on your transformation analysis
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="grid gap-4 pl-10">
          <div className="space-y-3">
            <Label>What traits define this version of you? (Select all that apply)</Label>
            
            {/* Suggested traits from analysis */}
            {suggestedTraits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gold">From your transformation analysis:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTraits.map((trait) => (
                    <Label
                      key={trait}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm ${
                        (answers.characterTraits || []).includes(trait)
                          ? "bg-gold/20 border-gold text-gold"
                          : "border-gold/50 hover:bg-gold/10"
                      }`}
                    >
                      <Checkbox
                        checked={(answers.characterTraits || []).includes(trait)}
                        onCheckedChange={() => toggleTrait(trait)}
                        className="sr-only"
                      />
                      {trait}
                    </Label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {CHARACTER_TRAITS.filter(t => !suggestedTraits.includes(t)).map((trait) => (
                <Label
                  key={trait}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm ${
                    (answers.characterTraits || []).includes(trait)
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={(answers.characterTraits || []).includes(trait)}
                    onCheckedChange={() => toggleTrait(trait)}
                    className="sr-only"
                  />
                  {trait}
                </Label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="howOthersDescribe">
              How do others describe you in this reality?
            </Label>
            <Input
              id="howOthersDescribe"
              placeholder="Example: The visionary who changed the industry, an inspiration to millions..."
              value={answers.howOthersDescribe || ""}
              onChange={(e) => updateAnswer("howOthersDescribe", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dailyMindset">
              What's your daily mindset and inner dialogue?
            </Label>
            <Input
              id="dailyMindset"
              placeholder="Example: I am unstoppable, everything I touch turns to gold, I attract success..."
              value={answers.dailyMindset || ""}
              onChange={(e) => updateAnswer("dailyMindset", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 5: Actions & Key Moments */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-lg font-semibold">Your Actions & Key Moments</h3>
        </div>
        
        <div className="grid gap-4 pl-10">
          <div className="space-y-3">
            <Label>What are you doing in your vision? (Select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_ACTIVITIES.map((activity) => (
                <Label
                  key={activity}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm ${
                    (answers.primaryActivities || []).includes(activity)
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={(answers.primaryActivities || []).includes(activity)}
                    onCheckedChange={() => toggleActivity(activity)}
                    className="sr-only"
                  />
                  {activity}
                </Label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keyMoments">
              Describe 2-3 key moments or scenes you want to visualize
            </Label>
            <Textarea
              id="keyMoments"
              placeholder="Example: 1) Walking into my corner office overlooking the city. 2) Receiving an award at a gala. 3) Playing with my kids in the backyard of our dream home..."
              value={answers.keyMoments || ""}
              onChange={(e) => updateAnswer("keyMoments", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* Section 6: Additional Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Anything Else?</h3>
        </div>
        
        <div className="pl-10">
          <Textarea
            id="additionalDetails"
            placeholder="Add any other details, specific imagery, or feelings you want captured in your Mind Movie..."
            value={answers.additionalDetails || ""}
            onChange={(e) => updateAnswer("additionalDetails", e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to convert questionnaire answers into a rich description
export function buildDescriptionFromAnswers(answers: VisionAnswers): string {
  const parts: string[] = [];
  
  if (answers.primaryObjective) {
    parts.push(`VISION: ${answers.primaryObjective}`);
  }
  
  if (answers.successMetric) {
    parts.push(`SUCCESS MARKER: ${answers.successMetric}`);
  }
  
  const lifestyle: string[] = [];
  if (answers.dreamCar) lifestyle.push(`Driving: ${answers.dreamCar}`);
  if (answers.livingEnvironment) lifestyle.push(`Living: ${answers.livingEnvironment}`);
  if (answers.travelDestinations) lifestyle.push(`Traveling: ${answers.travelDestinations}`);
  if (lifestyle.length > 0) {
    parts.push(`LIFESTYLE: ${lifestyle.join(". ")}`);
  }
  
  const physical: string[] = [];
  if (answers.physicalState) physical.push(answers.physicalState);
  if (answers.wardrobeStyle) physical.push(`Dressed in ${answers.wardrobeStyle} style`);
  if (answers.energyLevel) physical.push(`${answers.energyLevel} energy`);
  if (physical.length > 0) {
    parts.push(`PHYSICAL PRESENCE: ${physical.join(". ")}`);
  }
  
  if (answers.characterTraits && answers.characterTraits.length > 0) {
    parts.push(`CHARACTER TRAITS: ${answers.characterTraits.join(", ")}`);
  }
  
  if (answers.howOthersDescribe) {
    parts.push(`REPUTATION: ${answers.howOthersDescribe}`);
  }
  
  if (answers.dailyMindset) {
    parts.push(`MINDSET: ${answers.dailyMindset}`);
  }
  
  if (answers.primaryActivities && answers.primaryActivities.length > 0) {
    parts.push(`ACTIVITIES: ${answers.primaryActivities.join(", ")}`);
  }
  
  if (answers.keyMoments) {
    parts.push(`KEY SCENES: ${answers.keyMoments}`);
  }
  
  if (answers.additionalDetails) {
    parts.push(`ADDITIONAL: ${answers.additionalDetails}`);
  }
  
  return parts.join("\n\n");
}

export const DEFAULT_VISION_ANSWERS: VisionAnswers = {
  primaryObjective: "",
  successMetric: "",
  dreamCar: "",
  livingEnvironment: "",
  travelDestinations: "",
  physicalState: "",
  wardrobeStyle: "",
  energyLevel: "",
  characterTraits: [],
  howOthersDescribe: "",
  dailyMindset: "",
  primaryActivities: [],
  keyMoments: "",
  additionalDetails: "",
};
