import { useState } from "react";
import { ChevronDown, Check, Volume2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ElevenLabs voice options
export const VOICE_OPTIONS = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Deep, commanding male voice", gender: "male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Warm, friendly male voice", gender: "male" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Professional British male", gender: "male" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Calm, authoritative male", gender: "male" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Energetic, motivational male", gender: "male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Warm, professional female", gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Soft, empathetic female", gender: "female" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Confident, clear female", gender: "female" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Young, enthusiastic female", gender: "female" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Elegant, refined female", gender: "female" },
] as const;

// Personality presets
export const PERSONALITY_PRESETS = [
  {
    id: "swag",
    name: "Swag Coach",
    emoji: "🔥",
    description: "Keep it 100, street-wise energy with real talk",
    style: "swag",
  },
  {
    id: "formal",
    name: "Executive Coach",
    emoji: "🎩",
    description: "Professional, refined, business-focused",
    style: "formal",
  },
  {
    id: "motivational",
    name: "Hype Master",
    emoji: "⚡",
    description: "High energy, Tony Robbins-style enthusiasm",
    style: "motivational",
  },
  {
    id: "zen",
    name: "Zen Guide",
    emoji: "🧘",
    description: "Calm, mindful, Eckhart Tolle-inspired",
    style: "zen",
  },
  {
    id: "drill",
    name: "Drill Sergeant",
    emoji: "🎖️",
    description: "Tough love, no excuses, David Goggins energy",
    style: "drill",
  },
  {
    id: "supportive",
    name: "Best Friend",
    emoji: "💛",
    description: "Warm, encouraging, always in your corner",
    style: "supportive",
  },
] as const;

export type VoiceOption = typeof VOICE_OPTIONS[number];
export type PersonalityPreset = typeof PERSONALITY_PRESETS[number];

interface DirectorAISettingsProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  selectedPersonality: PersonalityPreset;
  onPersonalityChange: (personality: PersonalityPreset) => void;
  disabled?: boolean;
}

export function DirectorAISettings({
  selectedVoice,
  onVoiceChange,
  selectedPersonality,
  onPersonalityChange,
  disabled,
}: DirectorAISettingsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Voice Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-1 border-border/50 bg-card/60 hover:bg-card text-xs"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{selectedVoice.name}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Voice</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-gold/70 font-normal">Male Voices</DropdownMenuLabel>
          {VOICE_OPTIONS.filter(v => v.gender === "male").map((voice) => (
            <DropdownMenuItem
              key={voice.id}
              onClick={() => onVoiceChange(voice)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                selectedVoice.id === voice.id && "bg-gold/10"
              )}
            >
              <div>
                <span className="font-medium">{voice.name}</span>
                <p className="text-xs text-muted-foreground">{voice.description}</p>
              </div>
              {selectedVoice.id === voice.id && <Check className="w-4 h-4 text-gold" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-gold/70 font-normal">Female Voices</DropdownMenuLabel>
          {VOICE_OPTIONS.filter(v => v.gender === "female").map((voice) => (
            <DropdownMenuItem
              key={voice.id}
              onClick={() => onVoiceChange(voice)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                selectedVoice.id === voice.id && "bg-gold/10"
              )}
            >
              <div>
                <span className="font-medium">{voice.name}</span>
                <p className="text-xs text-muted-foreground">{voice.description}</p>
              </div>
              {selectedVoice.id === voice.id && <Check className="w-4 h-4 text-gold" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Personality Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-1 border-border/50 bg-card/60 hover:bg-card text-xs"
          >
            <span>{selectedPersonality.emoji}</span>
            <span className="hidden sm:inline">{selectedPersonality.name}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-card border-border">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Coaching Style</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PERSONALITY_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onPersonalityChange(preset)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                selectedPersonality.id === preset.id && "bg-gold/10"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{preset.emoji}</span>
                <div>
                  <span className="font-medium">{preset.name}</span>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                </div>
              </div>
              {selectedPersonality.id === preset.id && <Check className="w-4 h-4 text-gold" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
