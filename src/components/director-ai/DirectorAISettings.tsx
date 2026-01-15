import { useState, useRef } from "react";
import { ChevronDown, Check, Volume2, Play, Loader2, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const PREVIEW_TEXT = "Hey there! I'm your Director AI coach, ready to help you create your best life.";

export function DirectorAISettings({
  selectedVoice,
  onVoiceChange,
  selectedPersonality,
  onPersonalityChange,
  disabled,
}: DirectorAISettingsProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPreviewingVoice(null);
  };

  const previewVoice = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If already previewing this voice, stop it
    if (previewingVoice === voice.id) {
      stopPreview();
      return;
    }
    
    // Stop any current preview
    stopPreview();
    
    setPreviewingVoice(voice.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text: PREVIEW_TEXT,
            voiceId: voice.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setPreviewingVoice(null);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setPreviewingVoice(null);
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (error) {
      console.error("Voice preview error:", error);
      setPreviewingVoice(null);
    }
  };

  const renderVoiceItem = (voice: VoiceOption) => (
    <DropdownMenuItem
      key={voice.id}
      onClick={() => onVoiceChange(voice)}
      className={cn(
        "flex items-center justify-between cursor-pointer",
        selectedVoice.id === voice.id && "bg-gold/10"
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={(e) => previewVoice(voice, e)}
          className="p-1 rounded hover:bg-gold/20 transition-colors"
          title={previewingVoice === voice.id ? "Stop preview" : "Preview voice"}
        >
          {previewingVoice === voice.id ? (
            <Square className="w-3 h-3 text-gold fill-gold" />
          ) : (
            <Play className="w-3 h-3 text-gold" />
          )}
        </button>
        <div>
          <span className="font-medium">{voice.name}</span>
          <p className="text-xs text-muted-foreground">{voice.description}</p>
        </div>
      </div>
      {selectedVoice.id === voice.id && <Check className="w-4 h-4 text-gold" />}
    </DropdownMenuItem>
  );
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
        <DropdownMenuContent align="end" className="w-64 bg-card border-border max-h-80 overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Voice (click ▶ to preview)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-gold/70 font-normal">Male Voices</DropdownMenuLabel>
          {VOICE_OPTIONS.filter(v => v.gender === "male").map(renderVoiceItem)}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-gold/70 font-normal">Female Voices</DropdownMenuLabel>
          {VOICE_OPTIONS.filter(v => v.gender === "female").map(renderVoiceItem)}
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
