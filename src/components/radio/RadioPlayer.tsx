import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, SkipForward, SkipBack } from "lucide-react";
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
    tracks,
    loading,
  } = useRadio();

  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize local audio element if hook doesn't provide one
  useEffect(() => {
    if (!localAudioRef.current) {
      localAudioRef.current = new Audio();
      localAudioRef.current.volume = volume;
    }

    const audio = localAudioRef.current;
    
    const handleTimeUpdate = () => setLocalCurrentTime(audio.currentTime);
    const handleDurationChange = () => setLocalDuration(audio.duration);
    const handleEnded = () => {
      // Try to play next track if available
      if (tracks.length > 0 && nowPlaying) {
        const currentIndex = tracks.findIndex(t => t.audio_url === nowPlaying.audio_url);
        if (currentIndex >= 0 && currentIndex < tracks.length - 1) {
          playTrack(tracks[currentIndex + 1]);
        }
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [tracks, nowPlaying, playTrack, volume]);

  // Sync now playing with local audio
  useEffect(() => {
    if (nowPlaying && localAudioRef.current) {
      if (localAudioRef.current.src !== nowPlaying.audio_url) {
        localAudioRef.current.src = nowPlaying.audio_url;
        localAudioRef.current.volume = volume;
      }
    }
  }, [nowPlaying, volume]);

  // Sync playing state
  useEffect(() => {
    if (!localAudioRef.current) return;
    
    if (isPlaying) {
      localAudioRef.current.play().catch(err => {
        console.error("Playback error:", err);
      });
    } else {
      localAudioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (localAudioRef.current) {
      localAudioRef.current.volume = volume;
    }
  }, [volume]);

  const handleLocalTogglePlay = () => {
    if (!nowPlaying) return;
    
    if (localAudioRef.current) {
      if (localAudioRef.current.paused) {
        localAudioRef.current.play().catch(console.error);
      } else {
        localAudioRef.current.pause();
      }
    }
    togglePlay();
  };

  const handleLocalSeek = (time: number) => {
    if (localAudioRef.current) {
      localAudioRef.current.currentTime = time;
      setLocalCurrentTime(time);
    }
    handleSeek(time);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayCurrentTime = localCurrentTime || currentTime;
  const displayDuration = localDuration || duration;

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
                <p className="text-sm text-muted-foreground">Select a track to play</p>
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
                value={[displayCurrentTime]}
                max={displayDuration || 100}
                step={1}
                onValueChange={([value]) => handleLocalSeek(value)}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(displayCurrentTime)}</span>
                <span>{formatTime(displayDuration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-gold/30 hover:border-gold hover:bg-gold/10"
              onClick={handleLocalTogglePlay}
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
      </CardContent>
    </Card>
  );
};
