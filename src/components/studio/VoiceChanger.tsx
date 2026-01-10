import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Mic2, Volume2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Popular ElevenLabs voices for voice changing
const VOICE_OPTIONS = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm, authoritative male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft, friendly female" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Confident male narrator" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Professional female" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Casual male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Young male" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Warm female" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "British female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "British male" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep male narrator" },
];

interface VoiceChangerProps {
  videoUrl: string;
  onVoiceChanged?: (audioUrl: string) => void;
}

export function VoiceChanger({ videoUrl, onVoiceChanged }: VoiceChangerProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [changedAudioUrl, setChangedAudioUrl] = useState<string | null>(null);

  const handleVoiceChange = async () => {
    if (!selectedVoice || !videoUrl) return;

    setIsProcessing(true);
    toast.info("Extracting audio and changing voice...", { duration: 10000 });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to use voice changer");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-voice-changer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            audioUrl: videoUrl, // Video URL - backend will extract audio
            voiceId: selectedVoice,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Voice change failed");
      }

      const data = await response.json();
      
      if (data.audioUrl) {
        setChangedAudioUrl(data.audioUrl);
        toast.success("Voice changed successfully!");
        onVoiceChanged?.(data.audioUrl);
      }
    } catch (error) {
      console.error("Voice change error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change voice");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (changedAudioUrl) {
      window.open(changedAudioUrl, "_blank");
    }
  };

  const selectedVoiceInfo = VOICE_OPTIONS.find(v => v.id === selectedVoice);

  return (
    <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2">
        <Mic2 className="h-5 w-5 text-primary" />
        <h4 className="font-medium text-primary">Voice Changer</h4>
        <span className="text-xs text-muted-foreground">(ElevenLabs)</span>
      </div>

      <p className="text-sm text-muted-foreground">
        Change the voice in your video using AI. Select a target voice and we'll transform the audio.
      </p>

      <div className="space-y-2">
        <Label>Target Voice</Label>
        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Select a voice..." />
          </SelectTrigger>
          <SelectContent>
            {VOICE_OPTIONS.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name} - {voice.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedVoiceInfo && (
          <p className="text-xs text-muted-foreground">
            {selectedVoiceInfo.description}
          </p>
        )}
      </div>

      <Button
        onClick={handleVoiceChange}
        disabled={isProcessing || !selectedVoice}
        className="w-full"
        variant="outline"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Voice...
          </>
        ) : (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Change Voice
          </>
        )}
      </Button>

      {changedAudioUrl && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">Changed Audio</span>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
          <audio
            src={changedAudioUrl}
            controls
            className="w-full h-10"
          />
          <p className="text-xs text-muted-foreground">
            Note: This is the audio track only. To replace the video's audio, 
            download both files and combine them in a video editor.
          </p>
        </div>
      )}
    </div>
  );
}
