import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Play, Pause, Volume2, VolumeX, Music, Headphones, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAudio } from "@/contexts/AudioContext";

interface NowPlaying {
  id: string;
  track_title: string;
  artist: string | null;
  audio_url: string;
}

// Floating particle component with memoized position
const FloatingParticle = ({ index, size = 2 }: { index: number; size?: number }) => {
  // Use index-based positioning instead of random to prevent re-render jank
  const position = useMemo(() => ({
    left: `${(index * 23) % 100}%`,
    top: `${(index * 37) % 100}%`,
  }), [index]);

  return (
    <div
      className="absolute rounded-full bg-gold/30 pointer-events-none"
      style={{
        width: size,
        height: size,
        left: position.left,
        top: position.top,
        animation: `float-particle 4s ease-in-out infinite ${index * 0.5}s`,
      }}
    />
  );
};

export const DirectorRadioCard = () => {
  const navigate = useNavigate();
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localVolume, setLocalVolume] = useState(0.7);

  // Use global audio context
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    currentSrc,
    audioOwner,
    playAudio, 
    pauseAudio, 
    setVolume,
    volume 
  } = useAudio();

  // Check if this card "owns" the current playback
  const isThisCardPlaying = isPlaying && audioOwner === 'radio-card';

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

  const togglePlay = async () => {
    if (!nowPlaying) return;
    
    if (isThisCardPlaying) {
      pauseAudio();
    } else {
      await playAudio(nowPlaying.audio_url, {
        title: nowPlaying.track_title,
        artist: nowPlaying.artist || undefined,
        owner: 'radio-card',
      });
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setLocalVolume(newVolume);
    setVolume(newVolume);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get current time/duration only if this card owns the playback
  const displayCurrentTime = isThisCardPlaying ? currentTime : 0;
  const displayDuration = isThisCardPlaying ? duration : 0;

  if (loading) {
    return null;
  }

  return (
    <Card 
      className={`glass-card cinematic-border overflow-hidden group hover:border-gold/50 transition-all duration-500 relative ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        boxShadow: isHovered 
          ? '0 0 50px rgba(212, 175, 55, 0.25), inset 0 0 60px rgba(212, 175, 55, 0.05)'
          : '0 0 30px rgba(212, 175, 55, 0.1), inset 0 0 50px rgba(212, 175, 55, 0.03)',
        transition: 'all 0.5s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Holographic scan lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(212,175,55,0.03)_50%)] bg-[length:100%_4px]"
          style={{
            animation: 'scan-line 8s linear infinite',
          }}
        />
      </div>
      
      {/* Animated border glow effect */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
          animation: 'holographic-shimmer 3s ease-in-out infinite',
        }}
      />

      {/* Floating particles - use index instead of random delay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingParticle index={0} size={3} />
        <FloatingParticle index={1} size={2} />
        <FloatingParticle index={2} size={4} />
        <FloatingParticle index={3} size={2} />
        <FloatingParticle index={4} size={3} />
      </div>
      
      {/* Sparkle particles */}
      <Sparkles className="absolute top-3 right-12 w-3 h-3 text-gold/40 animate-pulse pointer-events-none" />
      <Sparkles className="absolute bottom-4 right-24 w-2 h-2 text-amber-soft/30 animate-pulse pointer-events-none" style={{ animationDelay: '0.7s' }} />
      <Sparkles className="absolute top-8 right-6 w-2 h-2 text-gold/30 animate-pulse pointer-events-none" style={{ animationDelay: '1.3s' }} />

      <CardContent className="p-0 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold/20 via-amber-500/10 to-transparent p-4 border-b border-gold/20">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-amber-600/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                boxShadow: isThisCardPlaying ? '0 0 25px rgba(212,175,55,0.5)' : '0 0 15px rgba(212,175,55,0.2)',
                animation: isThisCardPlaying ? 'pulse-ring 2s ease-in-out infinite' : undefined,
              }}
            >
              {isThisCardPlaying ? (
                <Radio className="w-6 h-6 text-gold animate-pulse" />
              ) : (
                <Headphones className="w-6 h-6 text-gold" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gold font-medium uppercase tracking-wider">Director Radio</p>
                {isThisCardPlaying && (
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
                    width: `${displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0}%`,
                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.6)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(displayCurrentTime)}</span>
                <span>{formatTime(displayDuration)}</span>
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
                  boxShadow: isThisCardPlaying ? '0 0 20px rgba(212,175,55,0.4)' : undefined,
                }}
              >
                {isThisCardPlaying ? (
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
                  onClick={() => handleVolumeChange(localVolume === 0 ? 0.7 : 0)}
                >
                  {localVolume === 0 ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Slider
                  value={[localVolume * 100]}
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
