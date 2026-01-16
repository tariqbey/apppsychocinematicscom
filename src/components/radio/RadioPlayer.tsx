import { useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useRadio } from "@/hooks/useRadio";

export const RadioPlayer = () => {
  const {
    nowPlaying,
    isPlaying,
    volume,
    currentTime,
    duration,
    audioRef,
    togglePlay,
    handleVolumeChange,
    handleSeek,
    playTrack,
    loading,
  } = useRadio();

  // Create audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, [audioRef]);

  // Auto-play now playing track
  useEffect(() => {
    if (nowPlaying && audioRef.current) {
      audioRef.current.src = nowPlaying.audio_url;
      audioRef.current.volume = volume;
    }
  }, [nowPlaying, volume, audioRef]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card className="glass-card cinematic-border animate-pulse">
        <CardContent className="p-4">
          <div className="h-16 bg-muted/20 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card cinematic-border overflow-hidden">
      <CardContent className="p-0">
        {/* Now Playing Banner */}
        <div className="bg-gradient-to-r from-gold/20 via-amber-500/10 to-transparent p-4 border-b border-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/30 to-amber-600/30 flex items-center justify-center">
              <Radio className="w-6 h-6 text-gold animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gold font-medium uppercase tracking-wider">Director Radio</p>
              {nowPlaying ? (
                <>
                  <p className="font-medium truncate">{nowPlaying.track_title}</p>
                  {nowPlaying.artist && (
                    <p className="text-sm text-muted-foreground truncate">{nowPlaying.artist}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No track playing</p>
              )}
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="p-4 space-y-3">
          {/* Progress */}
          {nowPlaying && (
            <div className="space-y-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={([value]) => handleSeek(value)}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-gold/30 hover:border-gold hover:bg-gold/10"
              onClick={togglePlay}
              disabled={!nowPlaying}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-gold" />
              ) : (
                <Play className="h-5 w-5 text-gold ml-0.5" />
              )}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleVolumeChange(volume === 0 ? 0.8 : 0)}
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => handleVolumeChange(value / 100)}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef as React.RefObject<HTMLAudioElement>} preload="auto" />
      </CardContent>
    </Card>
  );
};
