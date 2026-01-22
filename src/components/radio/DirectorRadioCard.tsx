import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Play, Pause, Volume2, VolumeX, Music, Headphones, ExternalLink, Sparkles } from "lucide-react";
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
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

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
    <Card 
      className={`glass-card cinematic-border overflow-hidden group hover:border-gold/50 transition-all duration-500 relative ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.1), inset 0 0 50px rgba(212, 175, 55, 0.03)',
      }}
    >
      {/* Holographic scan lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.03)_50%)] bg-[length:100%_4px]" />
      </div>
      
      {/* Floating particles */}
      <Sparkles className="absolute top-3 right-12 w-3 h-3 text-gold/30 animate-pulse pointer-events-none" />
      <Sparkles className="absolute bottom-4 right-24 w-2 h-2 text-amber-soft/20 animate-pulse pointer-events-none" style={{ animationDelay: '0.7s' }} />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent)',
        animation: 'shimmer 3s ease-in-out infinite',
      }} />

      <CardContent className="p-0 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold/20 via-amber-500/10 to-transparent p-4 border-b border-gold/20">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-600/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                boxShadow: isPlaying ? '0 0 20px rgba(212,175,55,0.4)' : undefined,
              }}
            >
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
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-300 rounded-full"
                  style={{ 
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                    boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
                  }}
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
                className="h-10 w-10 rounded-full border-gold/30 hover:border-gold hover:bg-gold/10 transition-all duration-300"
                onClick={togglePlay}
                style={{
                  boxShadow: isPlaying ? '0 0 15px rgba(212,175,55,0.3)' : undefined,
                }}
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
