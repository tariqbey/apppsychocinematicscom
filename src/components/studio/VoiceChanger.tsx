import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Mic2, Volume2, Download, CheckCircle, Play, Square, Settings2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFFmpegMerge } from "@/hooks/useFFmpegMerge";

// Popular ElevenLabs voices for voice changing
const VOICE_OPTIONS = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm, authoritative male", previewText: "Hello, I'm George. I have a warm, authoritative voice." },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft, friendly female", previewText: "Hi there, I'm Sarah. My voice is soft and friendly." },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Confident male narrator", previewText: "This is Roger speaking. I'm your confident narrator." },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Professional female", previewText: "Hello, I'm Laura. I have a professional tone." },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Casual male", previewText: "Hey, I'm Charlie. Nice to meet you!" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Young male", previewText: "Hi, I'm Liam. I have a youthful voice." },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Warm female", previewText: "Hello, I'm Matilda. My voice is warm and inviting." },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "British female", previewText: "Hello, I'm Lily. I have a lovely British accent." },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "British male", previewText: "Good day, I'm Daniel. I speak with a British accent." },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep male narrator", previewText: "I'm Brian. My voice is deep and resonant." },
];

interface VoiceChangerProps {
  videoUrl: string;
  onVideoMerged?: (mergedVideoUrl: string) => void;
}

export function VoiceChanger({ videoUrl, onVideoMerged }: VoiceChangerProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [isChangingVoice, setIsChangingVoice] = useState(false);
  const [changedAudioUrl, setChangedAudioUrl] = useState<string | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { mergeAudioVideo, isProcessing: isMerging, progress } = useFFmpegMerge();

  const effectiveVoiceId = useCustomVoice ? customVoiceId : selectedVoice;

  const handlePreviewVoice = async (voiceId: string) => {
    // Stop any current preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (previewingVoiceId === voiceId && isPreviewPlaying) {
      setIsPreviewPlaying(false);
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voiceId);
    setIsPreviewPlaying(true);

    try {
      const voiceInfo = VOICE_OPTIONS.find(v => v.id === voiceId);
      const previewText = voiceInfo?.previewText || "Hello, this is a voice preview.";

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to preview voices");
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
            text: previewText,
            voiceId: voiceId,
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
        setIsPreviewPlaying(false);
        setPreviewingVoiceId(null);
      };
      
      audio.onerror = () => {
        setIsPreviewPlaying(false);
        setPreviewingVoiceId(null);
        toast.error("Failed to play preview");
      };

      await audio.play();
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to preview voice");
      setIsPreviewPlaying(false);
      setPreviewingVoiceId(null);
    }
  };

  const handleVoiceChangeAndMerge = async () => {
    if (!effectiveVoiceId || !videoUrl) return;

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
            voiceId: effectiveVoiceId,
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

      // Step 2: Merge audio with video using browser MediaRecorder
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
      a.download = `voice-changed-video-${Date.now()}.webm`;
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
        Transform the voice in your video. Select a voice or use your own ElevenLabs voice ID.
      </p>

      {/* Voice Selection */}
      {!useCustomVoice && (
        <div className="space-y-2">
          <Label>Target Voice</Label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isProcessing}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select a voice..." />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div className="flex items-center gap-2">
                    <span>{voice.name}</span>
                    <span className="text-xs text-muted-foreground">- {voice.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Voice Preview */}
          {selectedVoice && !isProcessing && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreviewVoice(selectedVoice)}
                disabled={isPreviewPlaying && previewingVoiceId !== selectedVoice}
              >
                {isPreviewPlaying && previewingVoiceId === selectedVoice ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Preview
                  </>
                )}
              </Button>
              {selectedVoiceInfo && (
                <p className="text-xs text-muted-foreground">{selectedVoiceInfo.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span>Advanced Options</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          {/* Custom Voice ID Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomVoice"
              checked={useCustomVoice}
              onChange={(e) => setUseCustomVoice(e.target.checked)}
              className="rounded border-border"
              disabled={isProcessing}
            />
            <Label htmlFor="useCustomVoice" className="text-sm cursor-pointer">
              Use custom ElevenLabs Voice ID
            </Label>
          </div>

          {useCustomVoice && (
            <div className="space-y-2">
              <Label>Custom Voice ID</Label>
              <Input
                placeholder="Enter your ElevenLabs voice ID..."
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                disabled={isProcessing}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Find voice IDs in your{" "}
                <a
                  href="https://elevenlabs.io/voice-library"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  ElevenLabs Voice Library
                </a>
              </p>
              
              {/* Preview Custom Voice */}
              {customVoiceId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreviewVoice(customVoiceId)}
                  disabled={isPreviewPlaying}
                >
                  {isPreviewPlaying && previewingVoiceId === customVoiceId ? (
                    <>
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Preview Custom Voice
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> To use your own cloned voice, go to Settings → Integrations and add your ElevenLabs API key. Then paste your voice ID above.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
        disabled={isProcessing || !effectiveVoiceId}
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
