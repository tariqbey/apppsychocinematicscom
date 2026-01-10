import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Mic2, Volume2, Download, Video, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFFmpegMerge } from "@/hooks/useFFmpegMerge";

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
  onVideoMerged?: (mergedVideoUrl: string) => void;
}

export function VoiceChanger({ videoUrl, onVideoMerged }: VoiceChangerProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isChangingVoice, setIsChangingVoice] = useState(false);
  const [changedAudioUrl, setChangedAudioUrl] = useState<string | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  
  const { mergeAudioVideo, isProcessing: isMerging, progress } = useFFmpegMerge();

  const handleVoiceChangeAndMerge = async () => {
    if (!selectedVoice || !videoUrl) return;

    setIsChangingVoice(true);
    setChangedAudioUrl(null);
    setMergedVideoUrl(null);
    
    toast.info("Step 1/2: Changing voice with ElevenLabs...", { duration: 15000 });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to use voice changer");
      }

      // Step 1: Change voice using ElevenLabs
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-voice-changer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            audioUrl: videoUrl,
            voiceId: selectedVoice,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Voice change failed");
      }

      const data = await response.json();
      
      if (!data.audioUrl) {
        throw new Error("No audio URL returned");
      }

      setChangedAudioUrl(data.audioUrl);
      toast.success("Voice changed! Step 2/2: Merging with video...");
      setIsChangingVoice(false);

      // Step 2: Merge audio with video using FFmpeg WASM
      const mergedUrl = await mergeAudioVideo(videoUrl, data.audioUrl);
      setMergedVideoUrl(mergedUrl);
      
      toast.success("Video merged successfully!");
      onVideoMerged?.(mergedUrl);
      
    } catch (error) {
      console.error("Voice change/merge error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process");
      setIsChangingVoice(false);
    }
  };

  const handleDownloadVideo = () => {
    if (mergedVideoUrl) {
      const a = document.createElement("a");
      a.href = mergedVideoUrl;
      a.download = `voice-changed-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadAudio = () => {
    if (changedAudioUrl) {
      window.open(changedAudioUrl, "_blank");
    }
  };

  const selectedVoiceInfo = VOICE_OPTIONS.find(v => v.id === selectedVoice);
  const isProcessing = isChangingVoice || isMerging;

  return (
    <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2">
        <Mic2 className="h-5 w-5 text-primary" />
        <h4 className="font-medium text-primary">Voice Changer</h4>
        <span className="text-xs text-muted-foreground">(ElevenLabs + Auto-Merge)</span>
      </div>

      <p className="text-sm text-muted-foreground">
        Transform the voice in your video. We'll change the voice and automatically merge it back into the video.
      </p>

      <div className="space-y-2">
        <Label>Target Voice</Label>
        <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isProcessing}>
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
        {selectedVoiceInfo && !isProcessing && (
          <p className="text-xs text-muted-foreground">
            {selectedVoiceInfo.description}
          </p>
        )}
      </div>

      {/* Progress indicator */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-muted-foreground">
              {isChangingVoice 
                ? "Changing voice with ElevenLabs..." 
                : progress?.message || "Processing..."}
            </span>
          </div>
          {progress && !isChangingVoice && (
            <Progress value={progress.progress} className="h-2" />
          )}
        </div>
      )}

      <Button
        onClick={handleVoiceChangeAndMerge}
        disabled={isProcessing || !selectedVoice}
        className="w-full"
        variant="outline"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isChangingVoice ? "Changing Voice..." : "Merging Video..."}
          </>
        ) : (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Change Voice & Merge
          </>
        )}
      </Button>

      {/* Merged Video Result */}
      {mergedVideoUrl && (
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-primary">Merged Video Ready!</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDownloadVideo}>
              <Download className="h-4 w-4 mr-1" />
              Download MP4
            </Button>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <video
              src={mergedVideoUrl}
              controls
              className="w-full max-h-[300px] bg-black/50"
            />
          </div>
        </div>
      )}

      {/* Audio-only download option */}
      {changedAudioUrl && !mergedVideoUrl && !isMerging && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">Changed Audio (backup)</span>
            <Button variant="ghost" size="sm" onClick={handleDownloadAudio}>
              <Download className="h-4 w-4 mr-1" />
              Audio Only
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
