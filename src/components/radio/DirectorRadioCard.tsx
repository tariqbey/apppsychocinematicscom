import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Play, Pause, Volume2, VolumeX, Music, Headphones, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface NowPlaying {
  id: string;
  track_title: string;
  artist: string | null;
  audio_url: string;
}

export const DirectorRadioCard = () => {
  const navigate = useNavigate();
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchNowPlaying();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('radio_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_featured_tracks',
        },
        () => {
          fetchNowPlaying();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNowPlaying = async () => {
    const { data, error } = await supabase
      .from("radio_featured_tracks")
      .select("id, track_title, artist, audio_url")
      .eq("is_now_playing", true)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setNowPlaying(data);
    } else {
      setNowPlaying(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    const audio = audioRef.current;
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [volume]);

  useEffect(() => {
    if (nowPlaying && audioRef.current) {
      const audio = audioRef.current;
      if (audio.src !== nowPlaying.audio_url) {
        audio.src = nowPlaying.audio_url;
        if (isPlaying) {
          audio.play().catch(console.error);
        }
      }
    }
  }, [nowPlaying, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current || !nowPlaying) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="glass-card cinematic-border overflow-hidden group hover:border-gold/50 transition-all duration-300">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold/20 via-amber-500/10 to-transparent p-4 border-b border-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-600/30 flex items-center justify-center">
              {isPlaying ? (
                <Radio className="w-6 h-6 text-gold animate-pulse" />
              ) : (
                <Headphones className="w-6 h-6 text-gold" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gold font-medium uppercase tracking-wider">Director Radio</p>
                {isPlaying && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
              {nowPlaying ? (
                <>
                  <p className="font-medium truncate">{nowPlaying.track_title}</p>
                  {nowPlaying.artist && (
                    <p className="text-sm text-muted-foreground truncate">{nowPlaying.artist}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Off Air - Check back later!</p>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        {nowPlaying && (
          <div className="p-4 space-y-3">
            {/* Progress */}
            <div className="space-y-1">
              <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Play/Volume Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-gold/30 hover:border-gold hover:bg-gold/10"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-gold" />
                ) : (
                  <Play className="h-4 w-4 text-gold ml-0.5" />
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleVolumeChange(volume === 0 ? 0.7 : 0)}
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
                  className="w-16"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/music')}
                className="text-gold hover:text-gold hover:bg-gold/10"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Browse All
              </Button>
            </div>
          </div>
        )}

        {/* No content state */}
        {!nowPlaying && (
          <div className="p-4 flex items-center gap-3 text-muted-foreground">
            <Music className="w-5 h-5" />
            <span className="text-sm">Tune in when the Director goes live!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
