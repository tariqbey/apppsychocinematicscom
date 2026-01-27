import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Download, Music, Library, Check } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';

interface SoundtrackPlayerProps {
  audioUrl: string;
  title?: string;
  isGenerating?: boolean;
  generationStatus?: string | null;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

export const SoundtrackPlayer: React.FC<SoundtrackPlayerProps> = ({
  audioUrl,
  title = 'Mind Movie Soundtrack',
  isGenerating = false,
  generationStatus,
  onSaveToLibrary,
  isSavedToLibrary = false,
}) => {
  const [localVolume, setLocalVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Use global audio context
  const { 
    isPlaying: globalIsPlaying, 
    currentTime, 
    duration,
    currentSrc,
    audioOwner,
    playAudio, 
    pauseAudio,
    seekTo,
    setVolume,
    setMuted
  } = useAudio();

  // Check if this player "owns" the current playback
  const isPlaying = globalIsPlaying && audioOwner === `soundtrack-${audioUrl}`;
  
  // Get time/duration only if this player owns playback
  const displayCurrentTime = isPlaying ? currentTime : 0;
  const displayDuration = isPlaying ? duration : 0;

  const togglePlay = async () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      await playAudio(audioUrl, {
        title,
        artist: 'Mind Movie',
        owner: `soundtrack-${audioUrl}`,
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
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isGenerating) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <Music className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Creating Your Soundtrack</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {generationStatus || 'Processing...'}
            </p>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-4">
        {/* Album Art Placeholder */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <Music className="h-8 w-8 text-primary" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground truncate">{title}</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10">
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
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(displayDuration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
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

              {onSaveToLibrary && (
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
                      Save to Library
                    </>
                  )}
                </Button>
              )}
            </div>

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
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
