import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, Volume2, VolumeX, Download, Music, Library, Check, 
  RefreshCw, Target, Loader2, AlertCircle, Trash2 
} from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { cn } from '@/lib/utils';

interface SongVersionCardProps {
  audioUrl: string | null;
  title: string;
  versionNumber: number;
  isGenerating?: boolean;
  generationStatus?: string | null;
  hasError?: boolean;
  errorMessage?: string;
  onRegenerate: () => void;
  onSaveToLibrary: () => void;
  onSetAsAnthem?: () => void;
  onDelete?: () => void;
  isSavedToLibrary?: boolean;
  isSettingAsAnthem?: boolean;
  isCurrentAnthem?: boolean;
  showAnthemButton?: boolean;
  isRegenerating?: boolean;
}

export const SongVersionCard: React.FC<SongVersionCardProps> = ({
  audioUrl,
  title,
  versionNumber,
  isGenerating = false,
  generationStatus,
  hasError = false,
  errorMessage,
  onRegenerate,
  onSaveToLibrary,
  onSetAsAnthem,
  onDelete,
  isSavedToLibrary = false,
  isSettingAsAnthem = false,
  isCurrentAnthem = false,
  showAnthemButton = false,
  isRegenerating = false,
}) => {
  const [localVolume, setLocalVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const { 
    isPlaying: globalIsPlaying, 
    currentTime, 
    duration,
    audioOwner,
    playAudio, 
    pauseAudio,
    seekTo,
    setVolume,
    setMuted
  } = useAudio();

  const ownerId = `song-version-${versionNumber}-${audioUrl}`;
  const isPlaying = globalIsPlaying && audioOwner === ownerId;
  const displayCurrentTime = isPlaying ? currentTime : 0;
  const displayDuration = isPlaying ? duration : 0;

  const togglePlay = async () => {
    if (!audioUrl) return;
    if (isPlaying) {
      pauseAudio();
    } else {
      await playAudio(audioUrl, {
        title: `${title} (v${versionNumber})`,
        artist: 'Mind Movie',
        owner: ownerId,
      });
    }
  };

  const handleSeek = (value: number[]) => {
    if (isPlaying) {
      seekTo(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setMuted(false);
      setVolume(localVolume || 0.8);
      setIsMuted(false);
    } else {
      setMuted(true);
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${title}-v${versionNumber}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Error state
  if (hasError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">Version {versionNumber}</span>
              </div>
              <h4 className="font-medium text-destructive">Generation Failed</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage || 'There was an error generating this version. Try regenerating with different settings.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="mt-3 gap-2"
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isRegenerating ? 'Regenerating...' : 'Try Again'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isGenerating && !audioUrl) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Music className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">Version {versionNumber}</span>
              </div>
              <h4 className="font-medium">Creating Your Soundtrack</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {generationStatus || 'Processing...'}
              </p>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary/50 animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No audio yet (shouldn't happen but handle gracefully)
  if (!audioUrl) {
    return null;
  }

  // Ready state with audio
  return (
    <Card className={cn(
      "border-border/50 transition-all",
      isCurrentAnthem && "border-gold/50 bg-gold/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Album Art */}
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
            <Music className="h-7 w-7 text-primary" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Title Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-muted-foreground shrink-0">v{versionNumber}</span>
                <h4 className="font-medium truncate">{title}</h4>
                {isCurrentAnthem && (
                  <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full shrink-0">
                    Current Anthem
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8 shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10 shrink-0">
                {formatTime(displayCurrentTime)}
              </span>
              <Slider
                value={[displayCurrentTime]}
                min={0}
                max={displayDuration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 shrink-0">
                {formatTime(displayDuration)}
              </span>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={togglePlay}
                  className="gap-2"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>

                <Button
                  variant={isSavedToLibrary ? "secondary" : "outline"}
                  size="sm"
                  onClick={onSaveToLibrary}
                  disabled={isSavedToLibrary}
                  className="gap-2"
                >
                  {isSavedToLibrary ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Library className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="gap-2"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : localVolume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            {/* Anthem Button */}
            {showAnthemButton && onSetAsAnthem && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetAsAnthem}
                disabled={isSettingAsAnthem || isCurrentAnthem}
                className="w-full gap-2 border-gold/30 text-gold hover:bg-gold/10"
              >
                {isCurrentAnthem ? (
                  <>
                    <Check className="w-4 h-4" />
                    Set as Chief Aim Anthem
                  </>
                ) : isSettingAsAnthem ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Use as Chief Aim Anthem
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
