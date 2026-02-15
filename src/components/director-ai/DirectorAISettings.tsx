import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Volume2, Play, Square, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ElevenLabs voice options - American voices prioritized
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "American, energetic motivational male", gender: "male" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "American, deep commanding male", gender: "male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "American, warm friendly male", gender: "male" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "American, smooth confident male", gender: "male" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", description: "American, casual conversational male", gender: "male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "American, warm professional female", gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "American, soft empathetic female", gender: "female" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "American, confident clear female", gender: "female" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "American, natural friendly female", gender: "female" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "American, elegant refined female", gender: "female" },
];

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
  {
    id: "hustler",
    name: "The Hustler",
    emoji: "💰",
    description: "Jay-Z energy, from the block, talks real",
    style: "hustler",
  },
] as const;

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: string;
}

export type PersonalityPreset = typeof PERSONALITY_PRESETS[number];

// Load custom voices from localStorage
export const loadCustomVoices = (): VoiceOption[] => {
  try {
    const saved = localStorage.getItem("director-ai-custom-voices");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export const saveCustomVoices = (voices: VoiceOption[]) => {
  localStorage.setItem("director-ai-custom-voices", JSON.stringify(voices));
};

// Get all voices (built-in + custom)
export const getAllVoices = (): VoiceOption[] => {
  return [...VOICE_OPTIONS, ...loadCustomVoices()];
};

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
  const [showCustomVoiceDialog, setShowCustomVoiceDialog] = useState(false);
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [customVoiceName, setCustomVoiceName] = useState("");
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>(loadCustomVoices);
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
    
    if (previewingVoice === voice.id) {
      stopPreview();
      return;
    }
    
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
      toast.error("Failed to preview voice. Make sure your ElevenLabs API key is set in Settings → Integrations.");
    }
  };

  const handleAddCustomVoice = () => {
    if (!customVoiceId.trim() || !customVoiceName.trim()) {
      toast.error("Please enter both a name and voice ID");
      return;
    }

    const newVoice: VoiceOption = {
      id: customVoiceId.trim(),
      name: customVoiceName.trim(),
      description: "Custom ElevenLabs voice",
      gender: "custom",
    };

    const updated = [...customVoices, newVoice];
    setCustomVoices(updated);
    saveCustomVoices(updated);
    onVoiceChange(newVoice);
    setCustomVoiceId("");
    setCustomVoiceName("");
    setShowCustomVoiceDialog(false);
    toast.success(`Added custom voice: ${newVoice.name}`);
  };

  const handleRemoveCustomVoice = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customVoices.filter(v => v.id !== voiceId);
    setCustomVoices(updated);
    saveCustomVoices(updated);
    if (selectedVoice.id === voiceId) {
      onVoiceChange(VOICE_OPTIONS[0]);
    }
    toast.success("Custom voice removed");
  };

  const renderVoiceItem = (voice: VoiceOption, isCustom = false) => (
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
        <div className="flex-1 min-w-0">
          <span className="font-medium">{voice.name}</span>
          <p className="text-xs text-muted-foreground truncate">{voice.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isCustom && (
          <button
            onClick={(e) => handleRemoveCustomVoice(voice.id, e)}
            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove custom voice"
          >
            ×
          </button>
        )}
        {selectedVoice.id === voice.id && <Check className="w-4 h-4 text-gold" />}
      </div>
    </DropdownMenuItem>
  );

  return (
    <>
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
            
            {/* Custom voices section */}
            {customVoices.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-gold/70 font-normal">🎤 My Voices</DropdownMenuLabel>
                {customVoices.map(v => renderVoiceItem(v, true))}
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuLabel className="text-xs text-gold/70 font-normal">Male Voices</DropdownMenuLabel>
            {VOICE_OPTIONS.filter(v => v.gender === "male").map(v => renderVoiceItem(v))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gold/70 font-normal">Female Voices</DropdownMenuLabel>
            {VOICE_OPTIONS.filter(v => v.gender === "female").map(v => renderVoiceItem(v))}
            <DropdownMenuSeparator />
            
            {/* Add custom voice button */}
            <DropdownMenuItem
              onClick={() => setShowCustomVoiceDialog(true)}
              className="cursor-pointer text-gold hover:text-gold"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Add My ElevenLabs Voice</span>
            </DropdownMenuItem>
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

      {/* Custom Voice Dialog */}
      <Dialog open={showCustomVoiceDialog} onOpenChange={setShowCustomVoiceDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-gold">Add Your ElevenLabs Voice</DialogTitle>
            <DialogDescription>
              Use your own cloned or custom voices from ElevenLabs. Find your Voice ID in the{" "}
              <a 
                href="https://elevenlabs.io/voice-library" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gold underline"
              >
                ElevenLabs Voice Library
              </a>{" "}
              → click on a voice → copy the Voice ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Voice Name</label>
              <Input
                value={customVoiceName}
                onChange={(e) => setCustomVoiceName(e.target.value)}
                placeholder='e.g. "My Voice Clone"'
                className="bg-background border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">ElevenLabs Voice ID</label>
              <Input
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                placeholder="e.g. pNInz6obpgDQGcFmaJgB"
                className="bg-background border-border font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Make sure your ElevenLabs API key is set in <strong>Settings → Integrations</strong> to use your own voices.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomVoiceDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomVoice}
              className="bg-gold text-black hover:bg-gold/90"
              disabled={!customVoiceId.trim() || !customVoiceName.trim()}
            >
              Add Voice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
