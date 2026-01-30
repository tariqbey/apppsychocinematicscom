import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Music, Radio as RadioIcon, Crown, Sparkles,
  User, ChevronLeft, ChevronRight, Headphones, MoreHorizontal, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRadio, type RadioTrack, type FeaturedTrack } from "@/hooks/useRadio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AudioVisualizer, SimpleWaveformBars } from "@/components/music/AudioVisualizer";
import { useMediaSession, configureAudioForBackground, useIOSBackgroundAudio } from "@/hooks/useMediaSession";
import { useAudioOptional } from "@/hooks/useGlobalAudio";
import { TrackEditDialog } from "@/components/music/TrackEditDialog";
import { useAdminStatus } from "@/hooks/useAdminStatus";

interface FeaturedArtist {
  id: string;
  name: string;
  avatar_url: string | null;
  track_count: number;
  description?: string;
}

export default function RadioPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  
  // Use a standalone HTMLAudioElement for maximum mobile compatibility
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  // Radio hook
  const {
    playlists: stations,
    tracks: stationTracks,
    nowPlaying,
    isPlaying,
    volume,
    currentTime,
    duration,
    loading,
    selectPlaylist: selectStation,
    playTrack,
    togglePlay,
    handleVolumeChange: setRadioVolume,
    handleSeek,
  } = useRadio();

  // Local state for audio control
  const [localVolume, setLocalVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<RadioTrack | FeaturedTrack | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [editingTrack, setEditingTrack] = useState<RadioTrack | null>(null);
  
  // Admin status for edit permissions
  const { isAdmin } = useAdminStatus();

  // Featured artists state
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  // Fetch featured artists from radio_featured_tracks
  useEffect(() => {
    const fetchFeaturedArtists = async () => {
      try {
        // Get unique artists from featured tracks
        const { data: tracks, error } = await supabase
          .from('radio_featured_tracks')
          .select('*')
          .order('featured_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Create featured artist list from tracks
        const artistMap = new Map<string, FeaturedArtist>();
        
        for (const track of tracks || []) {
          const artistName = track.artist || 'Unknown Artist';
          if (!artistMap.has(artistName)) {
            artistMap.set(artistName, {
              id: track.id,
              name: artistName,
              avatar_url: null,
              track_count: 1,
              description: `Featured on Director Radio`,
            });
          } else {
            const artist = artistMap.get(artistName)!;
            artist.track_count++;
          }
        }

        setFeaturedArtists(Array.from(artistMap.values()));
      } catch (error) {
        console.error('Error fetching featured artists:', error);
      } finally {
        setLoadingArtists(false);
      }
    };

    fetchFeaturedArtists();
  }, []);

  // Stop any global audio when Radio page mounts (prevents overlap)
  const globalAudio = useAudioOptional();
  useEffect(() => {
    if (globalAudio?.isPlaying) {
      console.log('[Radio] Stopping global audio on mount');
      globalAudio.stopAudio();
    }
  }, []); // Only on mount

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }

    const cleanup = configureAudioForBackground(audioRef.current);
    setIsAudioReady(true);
    return cleanup;
  }, []);

  // Audio event listeners
  useEffect(() => {
    if (!isAudioReady) return;
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setLocalCurrentTime(audio.currentTime);
    const handleDurationChange = () => setLocalDuration(audio.duration || 0);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        handleNextTrack();
      }
    };
    const handleError = () => {
      toast.error('Error playing track');
      setLocalIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isAudioReady, isRepeat]);

  // iOS background audio
  useIOSBackgroundAudio(audioRef, localIsPlaying);

  // Media Session
  const handleSeekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setLocalCurrentTime(time);
    }
  }, []);

  const handleNextTrack = useCallback(() => {
    if (stationTracks.length === 0) return;
    const currentIndex = stationTracks.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = isShuffle 
      ? Math.floor(Math.random() * stationTracks.length)
      : (currentIndex + 1) % stationTracks.length;
    handlePlayTrack(stationTracks[nextIndex]);
  }, [stationTracks, currentTrack, isShuffle]);

  const handlePreviousTrack = useCallback(() => {
    if (stationTracks.length === 0) return;
    const currentIndex = stationTracks.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = currentIndex <= 0 ? stationTracks.length - 1 : currentIndex - 1;
    handlePlayTrack(stationTracks[prevIndex]);
  }, [stationTracks, currentTrack]);

  useMediaSession({
    title: currentTrack ? ('track_title' in currentTrack ? currentTrack.track_title : currentTrack.title) : undefined,
    artist: currentTrack?.artist || 'Director Radio',
    album: 'Director Radio',
    isPlaying: localIsPlaying,
    duration: localDuration,
    currentTime: localCurrentTime,
    audioElement: audioRef.current,
    onPlay: () => setLocalIsPlaying(true),
    onPause: () => setLocalIsPlaying(false),
    onNextTrack: handleNextTrack,
    onPreviousTrack: handlePreviousTrack,
    onSeekTo: handleSeekTo,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLocalSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setLocalCurrentTime(value[0]);
  };

  const handleLocalVolumeChange = (value: number[]) => {
    setLocalVolume(value[0]);
    setIsMuted(value[0] === 0);
    if (audioRef.current) {
      audioRef.current.muted = value[0] === 0;
      audioRef.current.volume = value[0];
    }
  };

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      if (localIsPlaying) {
        audio.pause();
        setLocalIsPlaying(false);
      } else {
        try {
          audio.muted = false;
          audio.volume = isMuted ? 0.8 : localVolume;
          await audio.play();
          setLocalIsPlaying(true);
        } catch (err) {
          console.error('[Radio] Play error:', err);
          toast.error('Tap again to play');
        }
      }
    } else if (stationTracks.length > 0) {
      await handlePlayTrack(stationTracks[0]);
    }
  };

  const handlePlayTrack = async (track: RadioTrack | FeaturedTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    const trackUrl = 'audio_url' in track ? track.audio_url : (track as any).audio_url;
    const trackTitle = 'track_title' in track ? track.track_title : track.title;

    // If same track, toggle play/pause
    if (currentTrack && ('id' in currentTrack && 'id' in track && currentTrack.id === track.id)) {
      if (localIsPlaying) {
        audio.pause();
        setLocalIsPlaying(false);
      } else {
        try {
          await audio.play();
          setLocalIsPlaying(true);
        } catch (err) {
          console.error('[Radio] Resume error:', err);
        }
      }
      return;
    }

    // New track
    console.log('[Radio] Playing:', trackTitle);
    audio.src = trackUrl;
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = isMuted ? 0.8 : localVolume;
    
    setCurrentTrack(track);

    try {
      await audio.play();
      setLocalIsPlaying(true);
    } catch (err) {
      console.error('[Radio] Play error:', err);
      toast.error('Tap again to play');
      setLocalIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RadioIcon className="w-10 h-10 text-gold animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Director';
  const currentTrackTitle = currentTrack 
    ? ('track_title' in currentTrack ? currentTrack.track_title : currentTrack.title)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col overflow-x-hidden w-full max-w-[100vw]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm w-full pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <RadioIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-display tracking-wide truncate">Director Radio</h1>
            </div>
          </div>
          {localIsPlaying && (
            <div className="flex items-center gap-2 text-gold text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden sm:inline">On Air</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-36 sm:pb-40 overflow-x-hidden w-full">
        {/* Featured Artists Carousel */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-display tracking-wide">Featured Artists</h2>
          </div>
          
          {loadingArtists ? (
            <div className="flex items-center justify-center h-48">
              <Sparkles className="w-8 h-8 text-gold animate-pulse" />
            </div>
          ) : featuredArtists.length === 0 ? (
            <Card className="p-8 text-center bg-muted/30">
              <Headphones className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Featured artists coming soon</p>
            </Card>
          ) : (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredArtists.map((artist) => (
                  <CarouselItem key={artist.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <Card className="overflow-hidden bg-gradient-to-br from-gold/10 via-card to-card border-gold/20 hover:border-gold/40 transition-all group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                          {artist.avatar_url ? (
                            <img 
                              src={artist.avatar_url} 
                              alt={artist.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-amber-500/10">
                              <User className="w-12 h-12 text-gold/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                            <Play className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <h3 className="font-medium truncate text-sm">{artist.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {artist.track_count} {artist.track_count === 1 ? 'track' : 'tracks'}
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4" />
              <CarouselNext className="hidden sm:flex -right-4" />
            </Carousel>
          )}
        </section>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Now Playing */}
          <div className="lg:col-span-1 space-y-6">
            {/* Now Playing Card */}
            <Card className="overflow-hidden bg-gradient-to-br from-gold/10 via-card to-card border-gold/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <RadioIcon className={cn("w-4 h-4", localIsPlaying ? "text-green-500 animate-pulse" : "text-gold")} />
                  <span className="text-xs text-gold font-medium uppercase tracking-wide">
                    {localIsPlaying ? 'Now Playing' : 'Director Radio'}
                  </span>
                </div>
                
                {/* Album Art / Visualizer */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-muted">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-amber-500/10">
                    <RadioIcon className="w-20 h-20 text-gold/50" />
                  </div>
                  {localIsPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-full h-32">
                        <AudioVisualizer 
                          audioElement={audioRef.current} 
                          isPlaying={localIsPlaying}
                          barCount={32}
                        />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-xl font-display text-white drop-shadow-lg truncate">
                      {currentTrackTitle || 'Select a track'}
                    </h2>
                    <p className="text-sm text-white/80 truncate">
                      {currentTrack?.artist || 'Director Radio'}
                    </p>
                  </div>
                </div>

                {/* Play Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousTrack}
                    disabled={stationTracks.length === 0}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleTogglePlay}
                    className="w-14 h-14 rounded-full bg-gold text-black hover:bg-gold/90"
                  >
                    {localIsPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextTrack}
                    disabled={stationTracks.length === 0}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>

                {/* Progress */}
                <div className="mt-4 space-y-2">
                  <Slider
                    value={[localCurrentTime]}
                    min={0}
                    max={localDuration || 100}
                    step={0.1}
                    onValueChange={handleLocalSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(localCurrentTime)}</span>
                    <span>{formatTime(localDuration)}</span>
                  </div>
                </div>

                {/* Volume */}
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (audioRef.current) {
                        audioRef.current.muted = !isMuted;
                      }
                    }}
                    className="h-8 w-8 text-muted-foreground"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : localVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleLocalVolumeChange}
                    className="flex-1"
                  />
                </div>

                {/* Shuffle/Repeat */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={cn("text-muted-foreground", isShuffle && "text-gold")}
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRepeat(!isRepeat)}
                    className={cn("text-muted-foreground", isRepeat && "text-gold")}
                  >
                    <Repeat className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stations & Tracks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stations */}
            <section>
              <h3 className="text-lg font-display tracking-wide mb-4 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-gold" />
                Stations
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {stations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => selectStation(station)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-all text-left w-full",
                      "bg-muted/30 hover:bg-muted/50 border border-transparent",
                      "hover:border-gold/30"
                    )}
                  >
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold/30 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                      {station.cover_image_url ? (
                        <img 
                          src={station.cover_image_url} 
                          alt={station.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <RadioIcon className="w-8 h-8 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{station.name}</h4>
                        {station.is_featured && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gold/20 text-gold">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {station.description || 'Curated by the Director'}
                      </p>
                    </div>
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>

            {/* Tracks */}
            {stationTracks.length > 0 && (
              <section>
                <h3 className="text-lg font-display tracking-wide mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-gold" />
                  Now Playing
                </h3>
                <Card>
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-2">
                      {stationTracks.map((track, index) => {
                        const isCurrentTrack = currentTrack && 'id' in currentTrack && currentTrack.id === track.id;
                        return (
                          <div
                            key={track.id}
                            className={cn(
                              "w-full flex items-center gap-4 p-3 rounded-lg transition-all text-left group",
                              "hover:bg-muted/50",
                              isCurrentTrack && "bg-gold/10 border border-gold/30"
                            )}
                          >
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground"
                            >
                              {isCurrentTrack && localIsPlaying ? (
                                <SimpleWaveformBars isPlaying={true} barCount={4} />
                              ) : (
                                <span className="text-sm group-hover:hidden">{index + 1}</span>
                              )}
                              <Play className="w-4 h-4 hidden group-hover:block" />
                            </button>
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className="w-10 h-10 rounded bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0"
                            >
                              <Music className="w-5 h-5 text-gold/70" />
                            </button>
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className={cn(
                                "font-medium truncate",
                                isCurrentTrack && "text-gold"
                              )}>
                                {track.title}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {track.artist || 'Director Radio'}
                              </p>
                            </button>
                            <span className="text-sm text-muted-foreground">
                              {track.duration_seconds ? formatTime(track.duration_seconds) : '--:--'}
                            </span>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingTrack(track)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </Card>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 w-full max-w-[100vw] overflow-hidden safe-area-bottom">
        <div className="container mx-auto px-2 sm:px-4 max-w-full">
          {/* Progress */}
          <div className="h-1 bg-muted/30 relative overflow-hidden">
            <div 
              className="h-full bg-gold transition-all duration-150"
              style={{ width: localDuration ? `${(localCurrentTime / localDuration) * 100}%` : '0%' }}
            />
            {localIsPlaying && (
              <div className="absolute inset-0 flex items-center">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full bg-gold/30 mx-px animate-pulse"
                    style={{ 
                      animationDelay: `${i * 0.05}s`,
                      opacity: localCurrentTime / localDuration > i / 30 ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between py-2 sm:py-3 gap-2">
            {/* Track info */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-[30%] sm:max-w-none">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <RadioIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                {localIsPlaying && currentTrack && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <SimpleWaveformBars isPlaying={true} barCount={3} className="h-2 sm:h-3" />
                  </div>
                )}
              </div>
              <div className="min-w-0 hidden xs:block">
                <p className="font-medium truncate text-xs sm:text-sm max-w-[80px] sm:max-w-none">
                  {currentTrackTitle || 'Director Radio'}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-none">
                  {currentTrack?.artist || 'Select a track'}
                </p>
              </div>
            </div>

            {/* Center controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsShuffle(!isShuffle)}
                className={cn("h-8 w-8 hidden sm:flex", isShuffle && "text-gold")}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousTrack}
                className="h-8 w-8"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleTogglePlay}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gold text-black hover:bg-gold/90"
              >
                {localIsPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextTrack}
                className="h-8 w-8"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRepeat(!isRepeat)}
                className={cn("h-8 w-8 hidden sm:flex", isRepeat && "text-gold")}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            {/* Right - Volume (desktop only) */}
            <div className="hidden sm:flex items-center gap-2 flex-1 justify-end max-w-[200px]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (audioRef.current) {
                    audioRef.current.muted = !isMuted;
                  }
                }}
                className="h-8 w-8"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : localVolume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleLocalVolumeChange}
                className="w-24"
              />
            </div>

            {/* Mobile time */}
            <div className="flex sm:hidden text-xs text-muted-foreground">
              {formatTime(localCurrentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Track Edit Dialog - Admin only */}
      {isAdmin && (
        <TrackEditDialog
          open={!!editingTrack}
          onOpenChange={(open) => !open && setEditingTrack(null)}
          track={editingTrack ? {
            id: editingTrack.id,
            title: editingTrack.title,
            artist: editingTrack.artist,
          } : null}
          tableName="radio_playlist_tracks"
          onSave={() => {
            // Refresh tracks after editing
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
