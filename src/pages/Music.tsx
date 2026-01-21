import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Plus, Music, Heart, MoreHorizontal, Upload,
  ListMusic, Radio, Mic2, User, Crown, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserPlaylists, type PlaylistTrack, type Playlist } from "@/hooks/useUserPlaylists";
import { useRadio } from "@/hooks/useRadio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AudioVisualizer, SimpleWaveformBars } from "@/components/music/AudioVisualizer";

export default function MusicPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // User playlists hook
  const {
    playlists,
    currentPlaylist,
    tracks,
    currentTrack,
    isPlaying,
    isLoading,
    selectPlaylist,
    playTrack,
    pauseTrack,
    playNextTrack,
    playPreviousTrack,
    setIsPlaying,
    setCurrentTrack,
    addTrackToPlaylist,
    getDefaultPlaylist,
    createPlaylist,
  } = useUserPlaylists();

  // Radio hook for admin content
  const { 
    playlists: radioPlaylists, 
    nowPlaying: radioNowPlaying,
    tracks: radioTracks,
    loading: radioLoading,
    selectPlaylist: selectRadioPlaylist,
    playTrack: playRadioTrack,
  } = useRadio();

  // Audio state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  // Audio playback - handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Update source if different
    const trackUrl = currentTrack.audio_url;
    if (audio.src !== trackUrl) {
      audio.src = trackUrl;
      audio.load();
      setAudioReady(false);
    }
    audio.volume = isMuted ? 0 : volume;
  }, [currentTrack, isMuted, volume]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Playback error:', err);
          // If autoplay blocked, wait for user interaction
          if (err.name === 'NotAllowedError') {
            toast.error('Click play again to start playback');
            setIsPlaying(false);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleCanPlay = () => setAudioReady(true);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNextTrack();
      }
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      toast.error('Error playing track. Please try again.');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isRepeat, playNextTrack, setIsPlaying]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
    if (audioRef.current) {
      audioRef.current.volume = value[0];
    }
  };

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    } else if (tracks.length > 0) {
      handlePlayTrack(tracks[0]);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle file upload
  const handleUploadTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      toast.error('Please upload an audio file (MP3, WAV, OGG, or M4A)');
      return;
    }

    setIsUploadingTrack(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generated-media')
        .getPublicUrl(fileName);

      // Get or create default playlist
      let playlist = await getDefaultPlaylist();
      if (!playlist) {
        playlist = await createPlaylist('My Tracks', 'Personal uploaded tracks', true);
      }

      if (playlist) {
        await addTrackToPlaylist(playlist.id, {
          title: file.name.replace(/\.[^/.]+$/, ''),
          audio_url: publicUrl,
          source_type: 'upload',
        });
        toast.success('Track uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload track');
    } finally {
      setIsUploadingTrack(false);
    }
  };

  const handlePlayTrack = (track: PlaylistTrack) => {
    const audio = audioRef.current;
    
    // If same track, toggle play/pause
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    
    // Set the track - this triggers the useEffect to load and play
    setCurrentTrack(track);
    setIsPlaying(true);
    
    // Force audio to load and play immediately
    if (audio) {
      audio.src = track.audio_url;
      audio.load();
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch((err) => {
        console.error('Play error:', err);
        if (err.name === 'NotAllowedError') {
          toast.info('Click the play button to start');
        }
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-gold animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || (profile as any)?.character_name || user.email?.split('@')[0] || 'Director';
  const avatarUrl = profile?.avatar_url || (profile as any)?.hero_front_url;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col overflow-x-hidden w-full max-w-[100vw]">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm w-full">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-display tracking-wide truncate">Director Radio</h1>
            </div>
          </div>
          <label className="flex-shrink-0">
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={handleUploadTrack}
              disabled={isUploadingTrack}
            />
            <Button variant="outline" size="sm" asChild disabled={isUploadingTrack} className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
              <span className="cursor-pointer flex items-center gap-1 sm:gap-2">
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{isUploadingTrack ? 'Uploading...' : 'Upload'}</span>
              </span>
            </Button>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-36 sm:pb-40 overflow-x-hidden w-full">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 h-full">
          {/* Left Column - Featured Artist / Now Playing */}
          <div className="lg:col-span-1 space-y-6">
            {/* Featured Artist Card */}
            <Card className="overflow-hidden bg-gradient-to-br from-gold/10 via-card to-card border-gold/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-4 h-4 text-gold" />
                  <span className="text-xs text-gold font-medium uppercase tracking-wide">Featured Artist</span>
                </div>
                
                {/* Artist Photo */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-muted">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-amber-500/10">
                      <User className="w-20 h-20 text-gold/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-display text-white drop-shadow-lg">{displayName}</h2>
                    <p className="text-sm text-white/80">Director • Artist</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-display text-gold">{tracks.length}</p>
                    <p className="text-xs text-muted-foreground">Tracks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display text-gold">{playlists.length}</p>
                    <p className="text-xs text-muted-foreground">Playlists</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display text-gold">{profile?.current_streak || 0}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Now Playing Card with Visualizer */}
            {currentTrack && (
              <Card className="bg-card border-border/50 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Mic2 className="w-4 h-4 text-gold animate-pulse" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Now Playing</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold/30 to-amber-500/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <Music className="w-8 h-8 text-gold" />
                      {isPlaying && (
                        <div className="absolute inset-0 flex items-end justify-center pb-1">
                          <SimpleWaveformBars isPlaying={isPlaying} barCount={5} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{currentTrack.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {currentTrack.artist || displayName}
                      </p>
                    </div>
                  </div>
                  
                  {/* Audio Visualizer */}
                  <div className="h-16 bg-muted/30 rounded-lg overflow-hidden">
                    <AudioVisualizer 
                      audioElement={audioRef.current} 
                      isPlaying={isPlaying}
                      barCount={48}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Playlists & Tracks */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="my-tracks" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="my-tracks" className="gap-2">
                  <ListMusic className="w-4 h-4" />
                  <span className="hidden sm:inline">My Tracks</span>
                </TabsTrigger>
                <TabsTrigger value="playlists" className="gap-2">
                  <Music className="w-4 h-4" />
                  <span className="hidden sm:inline">Playlists</span>
                </TabsTrigger>
                <TabsTrigger value="radio" className="gap-2">
                  <Radio className="w-4 h-4" />
                  <span className="hidden sm:inline">Radio</span>
                </TabsTrigger>
              </TabsList>

              {/* My Tracks */}
              <TabsContent value="my-tracks" className="flex-1 mt-0">
                <Card className="h-full">
                  <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
                    <div className="p-4 space-y-2">
                      {tracks.length === 0 ? (
                        <div className="text-center py-12">
                          <Music className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="font-medium mb-2">No tracks yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload your own tracks or generate music in the Soundtrack Studio
                          </p>
                          <div className="flex gap-2 justify-center">
                            <label>
                              <input 
                                type="file" 
                                accept="audio/*" 
                                className="hidden" 
                                onChange={handleUploadTrack}
                              />
                              <Button size="sm" variant="outline" asChild>
                                <span className="cursor-pointer">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload
                                </span>
                              </Button>
                            </label>
                            <Button size="sm" onClick={() => navigate('/soundtrack')}>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate
                            </Button>
                          </div>
                        </div>
                      ) : (
                        tracks.map((track, index) => (
                          <button
                            key={track.id}
                            onClick={() => handlePlayTrack(track)}
                            className={cn(
                              "w-full flex items-center gap-4 p-3 rounded-lg transition-all text-left group",
                              "hover:bg-muted/50",
                              currentTrack?.id === track.id && "bg-gold/10 border border-gold/30"
                            )}
                          >
                            <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                              {currentTrack?.id === track.id && isPlaying ? (
                                <SimpleWaveformBars isPlaying={true} barCount={4} />
                              ) : (
                                <span className="text-sm group-hover:hidden">{index + 1}</span>
                              )}
                              <Play className="w-4 h-4 hidden group-hover:block" />
                            </div>
                            <div className="w-10 h-10 rounded bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0">
                              <Music className="w-5 h-5 text-gold/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium truncate",
                                currentTrack?.id === track.id && "text-gold"
                              )}>
                                {track.title}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {track.artist || displayName}
                              </p>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {track.duration_seconds ? formatTime(track.duration_seconds) : '--:--'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              {/* Playlists */}
              <TabsContent value="playlists" className="flex-1 mt-0">
                <Card className="h-full">
                  <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
                    <div className="p-4">
                      {playlists.length === 0 ? (
                        <div className="text-center py-12">
                          <ListMusic className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="font-medium mb-2">No playlists yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Your generated and uploaded tracks will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {playlists.map((playlist) => (
                            <button
                              key={playlist.id}
                              onClick={() => selectPlaylist(playlist)}
                              className={cn(
                                "group p-4 rounded-lg text-left transition-all",
                                "bg-muted/30 hover:bg-muted/50",
                                currentPlaylist?.id === playlist.id && "ring-2 ring-gold"
                              )}
                            >
                              <div className="aspect-square rounded-lg mb-3 bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center relative overflow-hidden">
                                {playlist.cover_image_url ? (
                                  <img 
                                    src={playlist.cover_image_url} 
                                    alt={playlist.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ListMusic className="w-12 h-12 text-gold/50" />
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                  <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <h4 className="font-medium truncate">{playlist.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {playlist.track_count || 0} tracks
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              {/* Radio */}
              <TabsContent value="radio" className="flex-1 mt-0">
                <Card className="h-full">
                  <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
                    <div className="p-4 space-y-4">
                      {radioLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Music className="w-8 h-8 text-gold animate-pulse" />
                        </div>
                      ) : radioPlaylists.length === 0 ? (
                        <div className="text-center py-12">
                          <Radio className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="font-medium mb-2">No stations available</h3>
                          <p className="text-sm text-muted-foreground">
                            Check back soon for curated radio stations
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {radioPlaylists.map((station) => (
                            <button
                              key={station.id}
                              onClick={() => selectRadioPlaylist(station)}
                              className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left w-full"
                            >
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold/30 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                                {station.cover_image_url ? (
                                  <img 
                                    src={station.cover_image_url} 
                                    alt={station.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Radio className="w-8 h-8 text-gold" />
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
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 w-full max-w-[100vw] overflow-hidden safe-area-bottom">
        <div className="container mx-auto px-2 sm:px-4 max-w-full">
          {/* Mini visualizer in progress bar area */}
          <div className="h-1 bg-muted/30 relative overflow-hidden">
            <div 
              className="h-full bg-gold transition-all duration-150"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full bg-gold/30 mx-px animate-pulse"
                    style={{ 
                      animationDelay: `${i * 0.05}s`,
                      opacity: currentTime / duration > i / 30 ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Progress Slider */}
          <div className="py-1.5 sm:py-2 px-1">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between py-2 sm:py-3 gap-2">
            {/* Track info - smaller on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-[30%] sm:max-w-none">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                {isPlaying && currentTrack && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <SimpleWaveformBars isPlaying={true} barCount={3} className="h-2 sm:h-3" />
                  </div>
                )}
              </div>
              <div className="min-w-0 hidden xs:block">
                <p className="font-medium truncate text-xs sm:text-sm max-w-[80px] sm:max-w-none">
                  {currentTrack?.title || 'No track'}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-none">
                  {currentTrack?.artist || displayName}
                </p>
              </div>
            </div>

            {/* Main controls - compact on mobile */}
            <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-4 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex", isShuffle && "text-gold")}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={playPreviousTrack}>
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gold hover:bg-gold/90 text-black flex-shrink-0"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={playNextTrack}>
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex", isRepeat && "text-gold")}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Volume & Time - hide on small mobile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0 max-w-[25%] sm:max-w-none">
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block whitespace-nowrap">
                {formatTime(currentTime)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-12 sm:w-24 hidden xs:block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
