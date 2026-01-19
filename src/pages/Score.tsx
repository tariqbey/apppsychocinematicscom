import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Plus, Music, Heart, Upload, Trash2, GripVertical,
  ListMusic, Mic2, User, Crown, Sparkles, MoreHorizontal, Edit2,
  FolderPlus, Download, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserPlaylists, type PlaylistTrack, type Playlist } from "@/hooks/useUserPlaylists";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AudioVisualizer, SimpleWaveformBars } from "@/components/music/AudioVisualizer";

export default function ScorePage() {
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
    removeTrackFromPlaylist,
    getDefaultPlaylist,
    createPlaylist,
    deletePlaylist,
    fetchPlaylistTracks,
  } = useUserPlaylists();

  // Audio state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  
  // Playlist management
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  
  // Drag and drop for track reordering
  const [draggedTrack, setDraggedTrack] = useState<PlaylistTrack | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Audio playback - handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const trackUrl = currentTrack.audio_url;
    if (audio.src !== trackUrl) {
      audio.src = trackUrl;
      audio.load();
    }
    audio.volume = isMuted ? 0 : volume;
  }, [currentTrack, isMuted, volume]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Playback error:', err);
        if (err.name === 'NotAllowedError') {
          toast.error('Click play again to start playback');
          setIsPlaying(false);
        }
      });
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
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNextTrack();
      }
    };
    const handleError = () => {
      toast.error('Error playing track');
      setIsPlaying(false);
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
      const { error: uploadError } = await supabase.storage
        .from('generated-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generated-media')
        .getPublicUrl(fileName);

      // Add to current playlist or default
      const targetPlaylist = currentPlaylist || await getDefaultPlaylist();
      if (targetPlaylist) {
        await addTrackToPlaylist(targetPlaylist.id, {
          title: file.name.replace(/\.[^/.]+$/, ''),
          audio_url: publicUrl,
          source_type: 'upload',
        });
        // Refresh tracks
        await fetchPlaylistTracks(targetPlaylist.id);
        toast.success('Track uploaded!');
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
    
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (audio) {
      audio.src = track.audio_url;
      audio.load();
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(console.error);
    }
  };

  // Create new playlist
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    setIsCreatingPlaylist(true);
    const playlist = await createPlaylist(newPlaylistName.trim());
    if (playlist) {
      setNewPlaylistName("");
      toast.success(`Created "${playlist.name}"`);
    }
    setIsCreatingPlaylist(false);
  };

  // Rename playlist
  const handleRenamePlaylist = async (playlistId: string) => {
    if (!editPlaylistName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('user_playlists')
        .update({ name: editPlaylistName.trim() })
        .eq('id', playlistId);
      
      if (error) throw error;
      toast.success('Playlist renamed');
      setEditingPlaylistId(null);
      // Refresh playlists
      window.location.reload();
    } catch {
      toast.error('Failed to rename playlist');
    }
  };

  // Track reordering via drag and drop
  const handleDragStart = (track: PlaylistTrack) => {
    setDraggedTrack(track);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedTrack || !currentPlaylist) return;

    const sourceIndex = tracks.findIndex(t => t.id === draggedTrack.id);
    if (sourceIndex === targetIndex) {
      setDraggedTrack(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder tracks
    const newTracks = [...tracks];
    newTracks.splice(sourceIndex, 1);
    newTracks.splice(targetIndex, 0, draggedTrack);

    // Update track_order in database
    try {
      const updates = newTracks.map((track, index) => 
        supabase
          .from('user_playlist_tracks')
          .update({ track_order: index + 1 })
          .eq('id', track.id)
      );
      
      await Promise.all(updates);
      await fetchPlaylistTracks(currentPlaylist.id);
      toast.success('Track order updated');
    } catch {
      toast.error('Failed to reorder tracks');
    }

    setDraggedTrack(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTrack(null);
    setDragOverIndex(null);
  };

  // Delete track
  const handleDeleteTrack = async (trackId: string) => {
    if (currentTrack?.id === trackId) {
      setIsPlaying(false);
      setCurrentTrack(null);
    }
    await removeTrackFromPlaylist(trackId);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-gold animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Director';
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-gold" />
              <h1 className="text-xl font-display tracking-wide">The Score</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                  {isUploadingTrack ? 'Uploading...' : 'Upload'}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-40 overflow-hidden">
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

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-display text-gold">{tracks.length}</p>
                    <p className="text-xs text-muted-foreground">Tracks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display text-gold">{playlists.length}</p>
                    <p className="text-xs text-muted-foreground">Playlists</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Now Playing Card */}
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
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="my-tracks" className="gap-2">
                  <ListMusic className="w-4 h-4" />
                  <span>My Tracks</span>
                </TabsTrigger>
                <TabsTrigger value="playlists" className="gap-2">
                  <Music className="w-4 h-4" />
                  <span>Playlists</span>
                </TabsTrigger>
              </TabsList>

              {/* My Tracks - with drag reordering */}
              <TabsContent value="my-tracks" className="flex-1 mt-0">
                <Card className="h-full">
                  <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <h3 className="font-medium">
                      {currentPlaylist?.name || 'All Tracks'}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {tracks.length} tracks
                    </span>
                  </div>
                  <ScrollArea className="h-[calc(100vh-420px)] min-h-[300px]">
                    <div className="p-4 space-y-1">
                      {tracks.length === 0 ? (
                        <div className="text-center py-12">
                          <Music className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="font-medium mb-2">No tracks yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload tracks or generate music in Soundtrack Studio
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
                          <div
                            key={track.id}
                            draggable
                            onDragStart={() => handleDragStart(track)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg transition-all group",
                              "hover:bg-muted/50 cursor-grab active:cursor-grabbing",
                              currentTrack?.id === track.id && "bg-gold/10 border border-gold/30",
                              dragOverIndex === index && "border-t-2 border-gold"
                            )}
                          >
                            {/* Drag handle */}
                            <GripVertical className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Track number / Playing indicator */}
                            <button 
                              onClick={() => handlePlayTrack(track)}
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground"
                            >
                              {currentTrack?.id === track.id && isPlaying ? (
                                <SimpleWaveformBars isPlaying={true} barCount={4} />
                              ) : (
                                <>
                                  <span className="text-sm group-hover:hidden">{index + 1}</span>
                                  <Play className="w-4 h-4 hidden group-hover:block" />
                                </>
                              )}
                            </button>
                            
                            {/* Track icon */}
                            <div className="w-10 h-10 rounded bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0">
                              <Music className="w-5 h-5 text-gold/70" />
                            </div>
                            
                            {/* Track info */}
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
                            
                            {/* Duration */}
                            <span className="text-sm text-muted-foreground">
                              {track.duration_seconds ? formatTime(track.duration_seconds) : '--:--'}
                            </span>
                            
                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover border-border">
                                <DropdownMenuItem onClick={() => handlePlayTrack(track)}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Play
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={track.audio_url} download className="flex items-center">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTrack(track.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              {/* Playlists */}
              <TabsContent value="playlists" className="flex-1 mt-0">
                <Card className="h-full">
                  <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <h3 className="font-medium">Your Playlists</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <FolderPlus className="w-4 h-4 mr-2" />
                          New Playlist
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Create New Playlist</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input
                            placeholder="Playlist name..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                          />
                          <Button 
                            onClick={handleCreatePlaylist} 
                            disabled={!newPlaylistName.trim() || isCreatingPlaylist}
                            className="w-full"
                          >
                            {isCreatingPlaylist ? 'Creating...' : 'Create Playlist'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ScrollArea className="h-[calc(100vh-420px)] min-h-[300px]">
                    <div className="p-4">
                      {playlists.length === 0 ? (
                        <div className="text-center py-12">
                          <ListMusic className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="font-medium mb-2">No playlists yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Create playlists to organize your music
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {playlists.map((playlist) => (
                            <div
                              key={playlist.id}
                              className={cn(
                                "group relative rounded-lg overflow-hidden transition-all",
                                "bg-muted/30 hover:bg-muted/50",
                                currentPlaylist?.id === playlist.id && "ring-2 ring-gold"
                              )}
                            >
                              {editingPlaylistId === playlist.id ? (
                                <div className="p-4 space-y-2">
                                  <Input
                                    value={editPlaylistName}
                                    onChange={(e) => setEditPlaylistName(e.target.value)}
                                    className="text-sm"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleRenamePlaylist(playlist.id)}
                                      className="flex-1"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setEditingPlaylistId(null)}
                                      className="flex-1"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => selectPlaylist(playlist)}
                                  className="w-full p-4 text-left"
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
                              )}
                              
                              {/* Playlist menu */}
                              {editingPlaylistId !== playlist.id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 bg-background/80"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-popover border-border">
                                    <DropdownMenuItem onClick={() => {
                                      setEditingPlaylistId(playlist.id);
                                      setEditPlaylistName(playlist.name);
                                    }}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => deletePlaylist(playlist.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
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
          <div className="h-1 bg-muted/30 relative overflow-hidden">
            <div 
              className="h-full bg-gold transition-all duration-150"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          
          {/* Progress Slider */}
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
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <Music className="w-6 h-6 text-gold" />
                {isPlaying && currentTrack && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <SimpleWaveformBars isPlaying={true} barCount={4} className="h-3" />
                  </div>
                )}
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
