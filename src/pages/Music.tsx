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

  // Audio playback effects - handle source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Only update source if it's different
    if (audio.src !== currentTrack.audio_url) {
      audio.src = currentTrack.audio_url;
      audio.load(); // Ensure the new source is loaded
    }
    audio.volume = isMuted ? 0 : volume;
    
    // Auto-play when track changes
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Playback error:', err);
          // Try again after a short delay
          setTimeout(() => {
            audio.play().catch(console.error);
          }, 100);
        });
      }
    }
  }, [currentTrack, isPlaying, isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNextTrack();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isRepeat, playNextTrack]);

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
  };

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    } else if (tracks.length > 0) {
      playTrack(tracks[0]);
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

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
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
    // If same track, toggle play/pause
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    // Set the track and trigger playback
    setCurrentTrack(track);
    setIsPlaying(true);
    
    // Force audio to play immediately
    const audio = audioRef.current;
    if (audio) {
      audio.src = track.audio_url;
      audio.load();
      audio.play().catch(console.error);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-gold" />
              <h1 className="text-xl font-display tracking-wide">Director Radio</h1>
            </div>
          </div>
          <label>
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={handleUploadTrack}
              disabled={isUploadingTrack}
            />
            <Button variant="outline" size="sm" asChild disabled={isUploadingTrack}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingTrack ? 'Uploading...' : 'Upload Track'}
              </span>
            </Button>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-32 overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
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

            {/* Now Playing Card */}
            {currentTrack && (
              <Card className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Mic2 className="w-4 h-4 text-gold animate-pulse" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Now Playing</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold/30 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-8 h-8 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{currentTrack.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {currentTrack.artist || displayName}
                      </p>
                    </div>
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
                              "w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left",
                              "hover:bg-muted/50",
                              currentTrack?.id === track.id && "bg-gold/10 border border-gold/30"
                            )}
                          >
                            <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                              {currentTrack?.id === track.id && isPlaying ? (
                                <div className="flex items-end gap-0.5 h-4">
                                  <div className="w-1 bg-gold animate-pulse" style={{ height: '60%' }} />
                                  <div className="w-1 bg-gold animate-pulse" style={{ height: '100%', animationDelay: '0.1s' }} />
                                  <div className="w-1 bg-gold animate-pulse" style={{ height: '40%', animationDelay: '0.2s' }} />
                                </div>
                              ) : (
                                <span className="text-sm">{index + 1}</span>
                              )}
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
                                {playlist.track_count} tracks
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
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50">
        <div className="container mx-auto px-4">
          {/* Progress bar */}
          <div className="py-2">
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
          <div className="flex items-center justify-between py-3">
            {/* Track info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate text-sm">
                  {currentTrack?.title || 'No track selected'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack?.artist || displayName}
                </p>
              </div>
            </div>

            {/* Main controls */}
            <div className="flex items-center gap-2 px-4">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isShuffle && "text-gold")}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={playPreviousTrack}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-gold hover:bg-gold/90 text-black"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={playNextTrack}>
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isRepeat && "text-gold")}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            {/* Volume & Time */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
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
    </div>
  );
}
