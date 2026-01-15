import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Sparkles, Volume2, Check, Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ElevenLabs voice options
const VOICE_OPTIONS = [
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
const PERSONALITY_PRESETS = [
  {
    id: "swag",
    name: "Swag Coach",
    emoji: "🔥",
    description: "Keep it 100, street-wise energy with real talk",
  },
  {
    id: "formal",
    name: "Executive Coach",
    emoji: "🎩",
    description: "Professional, refined, business-focused",
  },
  {
    id: "motivational",
    name: "Hype Master",
    emoji: "⚡",
    description: "High energy, Tony Robbins-style enthusiasm",
  },
  {
    id: "zen",
    name: "Zen Guide",
    emoji: "🧘",
    description: "Calm, mindful, Eckhart Tolle-inspired",
  },
  {
    id: "drill",
    name: "Drill Sergeant",
    emoji: "🎖️",
    description: "Tough love, no excuses, David Goggins energy",
  },
  {
    id: "supportive",
    name: "Best Friend",
    emoji: "💛",
    description: "Warm, encouraging, always in your corner",
  },
] as const;

type VoiceOption = typeof VOICE_OPTIONS[number];
type PersonalityPreset = typeof PERSONALITY_PRESETS[number];

const PREVIEW_TEXT = "Hey there! I'm your Director AI coach, ready to help you create your best life.";

export function DirectorAIPreferences() {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityPreset>(PERSONALITY_PRESETS[0]);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [saving, setSaving] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedVoiceId = localStorage.getItem("directorAI_voiceId");
    const savedPersonalityId = localStorage.getItem("directorAI_personalityId");

    if (savedVoiceId) {
      const voice = VOICE_OPTIONS.find((v) => v.id === savedVoiceId);
      if (voice) setSelectedVoice(voice);
    }

    if (savedPersonalityId) {
      const personality = PERSONALITY_PRESETS.find((p) => p.id === savedPersonalityId);
      if (personality) setSelectedPersonality(personality);
    }
  }, []);

  const stopPreview = () => {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      setAudioRef(null);
    }
    setPreviewingVoice(null);
  };

  const previewVoice = async (voice: VoiceOption) => {
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
            Authorization: `Bearer ${session.access_token}`,
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
      setAudioRef(audio);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setPreviewingVoice(null);
        setAudioRef(null);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setPreviewingVoice(null);
        setAudioRef(null);
      };

      await audio.play();
    } catch (error) {
      console.error("Voice preview error:", error);
      setPreviewingVoice(null);
      toast.error("Failed to preview voice");
    }
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem("directorAI_voiceId", selectedVoice.id);
    localStorage.setItem("directorAI_personalityId", selectedPersonality.id);
    
    setTimeout(() => {
      setSaving(false);
      toast.success("Director AI preferences saved!");
    }, 500);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-gold" />
          Director AI Voice & Personality
        </CardTitle>
        <CardDescription>
          Customize how your AI coach sounds and communicates with you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Voice Selection
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VOICE_OPTIONS.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                  selectedVoice.id === voice.id
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/50 bg-secondary/30"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      previewVoice(voice);
                    }}
                    className="p-1.5 rounded hover:bg-gold/20 transition-colors shrink-0"
                    title={previewingVoice === voice.id ? "Stop preview" : "Preview voice"}
                  >
                    {previewingVoice === voice.id ? (
                      <Square className="w-3.5 h-3.5 text-gold fill-gold" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-gold" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{voice.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{voice.description}</p>
                  </div>
                </div>
                {selectedVoice.id === voice.id && (
                  <Check className="w-4 h-4 text-gold shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Personality Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Coaching Personality
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERSONALITY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPersonality(preset)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                  selectedPersonality.id === preset.id
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/50 bg-secondary/30"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl shrink-0">{preset.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
                  </div>
                </div>
                {selectedPersonality.id === preset.id && (
                  <Check className="w-4 h-4 text-gold shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
