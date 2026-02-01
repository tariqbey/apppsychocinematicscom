import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Plus, Music, Heart, Upload, Trash2, GripVertical,
  ListMusic, Mic2, User, Crown, Sparkles, MoreHorizontal, Edit2,
  FolderPlus, Download, Check, X, CloudOff, Cloud, HardDrive, Loader2, Wifi, WifiOff, Target
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
import { useMediaSession, configureAudioForBackground, useIOSBackgroundAudio } from "@/hooks/useMediaSession";
import { useOfflineTracks } from "@/hooks/useOfflineTracks";
import { Badge } from "@/components/ui/badge";
import { useAudioOptional } from "@/hooks/useGlobalAudio";

export default function ScorePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  // Use a standalone HTMLAudioElement (like Director Radio) for maximum mobile compatibility.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const isIOSDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  
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

  // Offline tracks hook
  const {
    offlineTracks,
    cacheStats,
    isServiceWorkerReady,
    downloadTrack,
    removeOfflineTrack,
    isTrackCached,
    isTrackDownloading,
    clearAllOfflineTracks,
    formatSize,
  } = useOfflineTracks();

  // Online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Audio state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  
  // Playlist management
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  
  // Drag and drop for track reordering
  const [draggedTrack, setDraggedTrack] = useState<PlaylistTrack | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handle downloading track for offline
  const handleDownloadForOffline = async (track: PlaylistTrack) => {
    await downloadTrack(track.id, track.audio_url, track.title, track.artist || undefined);
  };

  // Handle removing track from offline
  const handleRemoveFromOffline = async (trackId: string) => {
    await removeOfflineTrack(trackId);
  };

  // Track the current audio source to avoid unnecessary reloads
  const currentAudioUrlRef = useRef<string | null>(null);

  // Stop any global audio when Score page mounts (prevents overlap)
  const globalAudio = useAudioOptional();
  useEffect(() => {
    if (globalAudio?.isPlaying) {
      console.log('[Score] Stopping global audio on mount');
      globalAudio.stopAudio();
    }
  }, []); // Only on mount

  // Initialize the audio element once (similar to Director Radio's approach)
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      // Safe defaults
      audioRef.current.crossOrigin = 'anonymous';
    }

    const cleanup = configureAudioForBackground(audioRef.current);
    setIsAudioReady(true);
    return cleanup;
  }, []);

  // Sync volume/mute to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  // Handle pause state only (play is done in click handler for gesture safety)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying]);

  // Track the last played track ID to detect auto-advance
  const lastPlayedTrackIdRef = useRef<string | null>(null);

  // Handle auto-advance: when currentTrack changes from playNextTrack(), load and play the new track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAudioReady || !currentTrack) return;
    
    // Only auto-play if this is a different track triggered by playNextTrack
    if (lastPlayedTrackIdRef.current && lastPlayedTrackIdRef.current !== currentTrack.id && isPlaying) {
      console.log('[Score] Auto-advancing to:', currentTrack.title);
      audio.src = currentTrack.audio_url;
      currentAudioUrlRef.current = currentTrack.audio_url;
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(err => {
        console.error('[Score] Auto-advance play error:', err);
        setIsPlaying(false);
      });
    }
    
    lastPlayedTrackIdRef.current = currentTrack.id;
  }, [currentTrack, isAudioReady, isPlaying, volume, isMuted, setIsPlaying]);

  // Audio event listeners
  useEffect(() => {
    if (!isAudioReady) return;
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
  }, [isAudioReady, isRepeat, playNextTrack, setIsPlaying]);

  // iOS-specific background audio handling
  useIOSBackgroundAudio(audioRef, isPlaying);

  // Media Session API for lock screen controls and background playback
  const handleSeekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useMediaSession({
    title: currentTrack?.title,
    artist: currentTrack?.artist || profile?.display_name || 'Unknown Artist',
    album: currentPlaylist?.name || 'The Score',
    isPlaying,
    duration,
    currentTime,
    audioElement: audioRef.current,
    onPlay: () => {
      // Called from lock screen play button - audio.play() is handled in useMediaSession
      setIsPlaying(true);
    },
    onPause: () => {
      // Called from lock screen pause button - audio.pause() is handled in useMediaSession
      setIsPlaying(false);
    },
    onNextTrack: playNextTrack,
    onPreviousTrack: playPreviousTrack,
    onSeekTo: handleSeekTo,
  });

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
      audioRef.current.muted = value[0] === 0;
      audioRef.current.volume = value[0];
    }
  };

  // GESTURE-SAFE: Toggle play directly on audio element
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          // Force an audible state (users report it feels muted)
          const effectiveVolume = !isMuted && volume > 0 ? volume : 0.8;
          audio.muted = false;
          audio.volume = effectiveVolume;
          if (isMuted) setIsMuted(false);
          if (volume === 0) setVolume(effectiveVolume);
          console.log('[Score] togglePlay() muted=%s volume=%s src=%s', audio.muted, audio.volume, audio.currentSrc || audio.src);
          await audio.play();
          setIsPlaying(true);
        } catch (err) {
          console.error('[Score] Toggle play error:', err);
          toast.error('Tap again to play');
        }
      }
    } else if (tracks.length > 0) {
      await handlePlayTrack(tracks[0]);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle multiple file uploads
  const handleUploadTracks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    // More permissive audio type detection - check MIME type OR extension
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac'];
    const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i;
    
    const validFiles = Array.from(files).filter(file => {
      const hasValidType = allowedTypes.includes(file.type) || file.type.startsWith('audio/');
      const hasValidExtension = audioExtensions.test(file.name);
      console.log(`[Score Upload] File: ${file.name}, Type: ${file.type}, ValidType: ${hasValidType}, ValidExt: ${hasValidExtension}`);
      return hasValidType || hasValidExtension;
    });

    if (validFiles.length === 0) {
      toast.error('Please upload audio files (MP3, WAV, OGG, or M4A)');
      return;
    }

    if (validFiles.length < files.length) {
      toast.warning(`${files.length - validFiles.length} non-audio files were skipped`);
    }

    setIsUploadingTrack(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    const targetPlaylist = currentPlaylist || await getDefaultPlaylist();
    if (!targetPlaylist) {
      toast.error('No playlist available');
      setIsUploadingTrack(false);
      setUploadProgress(null);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress({ current: i + 1, total: validFiles.length });

      try {
        // Sanitize filename to avoid special characters issues
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;
        
        // Determine proper content type - fallback to audio/mpeg for mp3
        let contentType = file.type;
        if (!contentType || !contentType.startsWith('audio/')) {
          const ext = file.name.split('.').pop()?.toLowerCase();
          const mimeMap: Record<string, string> = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
            'wma': 'audio/x-ms-wma',
          };
          contentType = mimeMap[ext || ''] || 'audio/mpeg';
        }
        
        console.log(`[Score Upload] Uploading: ${fileName}, Size: ${file.size} bytes, ContentType: ${contentType}`);
        
        console.log(`[Score Upload] Starting upload with explicit contentType: ${contentType}`);
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('generated-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true, // Allow overwriting if same filename exists
            contentType: contentType,
          });

        if (uploadError) {
          console.error(`[Score Upload] Storage error:`, uploadError.message, uploadError);
          toast.error(`Upload failed: ${uploadError.message}`);
          throw uploadError;
        }

        console.log(`[Score Upload] Success:`, uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('generated-media')
          .getPublicUrl(fileName);

        await addTrackToPlaylist(targetPlaylist.id, {
          title: file.name.replace(/\.[^/.]+$/, ''),
          audio_url: publicUrl,
          source_type: 'upload',
        });
        successCount++;
      } catch (error: any) {
        console.error(`[Score Upload] Error for ${file.name}:`, error?.message || error);
        failCount++;
      }
    }

    // Refresh tracks after all uploads
    await fetchPlaylistTracks(targetPlaylist.id);

    if (successCount > 0) {
      toast.success(`${successCount} track${successCount > 1 ? 's' : ''} uploaded!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} track${failCount > 1 ? 's' : ''} failed to upload`);
    }

    setIsUploadingTrack(false);
    setUploadProgress(null);
    
    // Reset the input
    e.target.value = '';
  };

  // GESTURE-SAFE: Play audio directly in click handler for mobile compatibility
  const handlePlayTrack = async (track: PlaylistTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If clicking on the same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          const effectiveVolume = !isMuted && volume > 0 ? volume : 0.8;
          audio.muted = false;
          audio.volume = effectiveVolume;
          if (isMuted) setIsMuted(false);
          if (volume === 0) setVolume(effectiveVolume);
          console.log('[Score] resume same track muted=%s volume=%s src=%s', audio.muted, audio.volume, audio.currentSrc || audio.src);
          await audio.play();
          setIsPlaying(true);
        } catch (err) {
          console.error('[Score] Play error:', err);
          toast.error('Tap again to play');
        }
      }
      return;
    }

    // New track: load and play directly in the click handler
    console.log('[Score] Playing new track:', track.audio_url);
    currentAudioUrlRef.current = track.audio_url;
    audio.src = track.audio_url;
    audio.currentTime = 0;
    {
      const effectiveVolume = !isMuted && volume > 0 ? volume : 0.8;
      audio.muted = false;
      audio.volume = effectiveVolume;
      if (isMuted) setIsMuted(false);
      if (volume === 0) setVolume(effectiveVolume);
    }
    console.log('[Score] new track pre-play muted=%s volume=%s src=%s', audio.muted, audio.volume, audio.currentSrc || audio.src);
    
    setCurrentTrack(track);

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('[Score] Play error:', err);
      toast.error('Tap again to play');
      setIsPlaying(false);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col overflow-x-hidden w-full max-w-[100vw]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm w-full">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-display tracking-wide truncate">The Score</h1>
            </div>
          </div>
          <div className="flex items-center flex-shrink-0">
            <label>
              <input 
                type="file" 
                accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,audio/*"
                multiple
                className="hidden"
                onChange={handleUploadTracks}
                disabled={isUploadingTrack}
              />
              <Button variant="outline" size="sm" asChild disabled={isUploadingTrack} className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <span className="cursor-pointer flex items-center gap-1 sm:gap-2">
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">
                    {isUploadingTrack && uploadProgress
                      ? `${uploadProgress.current}/${uploadProgress.total}`
                      : 'Upload'}
                  </span>
                </span>
              </Button>
            </label>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-36 sm:pb-40 overflow-x-hidden w-full">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Left Column - Featured Artist / Now Playing */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Featured Artist Card - Compact on mobile */}
            <Card className="overflow-hidden bg-gradient-to-br from-gold/10 via-card to-card border-gold/20">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold" />
                  <span className="text-[10px] sm:text-xs text-gold font-medium uppercase tracking-wide">Featured Artist</span>
                </div>
                
                {/* Mobile: horizontal layout, Desktop: vertical square */}
                <div className="flex sm:flex-col gap-3 sm:gap-0">
                  <div className="relative w-24 h-24 sm:w-full sm:aspect-square rounded-lg overflow-hidden sm:mb-4 bg-muted flex-shrink-0">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-amber-500/10">
                        <User className="w-10 h-10 sm:w-20 sm:h-20 text-gold/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Name overlay only on desktop */}
                    <div className="hidden sm:block absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl font-display text-white drop-shadow-lg">{displayName}</h2>
                      <p className="text-sm text-white/80">Director • Artist</p>
                    </div>
                  </div>
                  
                  {/* Mobile: name and stats beside image */}
                  <div className="flex-1 flex flex-col justify-center sm:hidden">
                    <h2 className="text-lg font-display text-foreground mb-0.5">{displayName}</h2>
                    <p className="text-xs text-muted-foreground mb-2">Director • Artist</p>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-lg font-display text-gold">{tracks.length}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">Tracks</span>
                      </div>
                      <div>
                        <span className="text-lg font-display text-gold">{playlists.length}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">Playlists</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop stats */}
                <div className="hidden sm:grid grid-cols-2 gap-4 text-center">
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

            {/* Now Playing Card with Enhanced Waveform */}
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
                  
                  {/* Enhanced Audio Visualizer */}
                  <div className="h-24 bg-gradient-to-b from-muted/20 to-muted/40 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5" />
                    <AudioVisualizer 
                      audioElement={audioRef.current} 
                      isPlaying={isPlaying}
                      barCount={64}
                      barColor="#D4AF37"
                      // Keep WebAudio OFF here to match Director Radio's (working) approach.
                      enableWebAudio={false}
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="w-8 h-8 text-gold/60" />
                      </div>
                    )}
                  </div>
                  
                  {/* Time display */}
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Offline Status Card */}
            {isServiceWorkerReady && (
              <Card className={cn(
                "border-border/50",
                !isOnline && "border-amber-500/50 bg-amber-500/5"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {isOnline ? 'Online' : 'Offline Mode'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Cached Tracks</span>
                      </div>
                      <span className="text-sm font-medium text-gold">
                        {offlineTracks.length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Storage Used</span>
                      <span className="text-sm">{formatSize(cacheStats.totalSize)}</span>
                    </div>
                    
                    {offlineTracks.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={clearAllOfflineTracks}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Offline Cache
                      </Button>
                    )}
                    
                    {!isOnline && offlineTracks.length === 0 && (
                      <p className="text-xs text-amber-500 mt-2">
                        No tracks saved for offline. Connect to internet to download tracks.
                      </p>
                    )}
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
                  <div className="p-4 border-b border-border/50 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">
                        {currentPlaylist?.name || 'All Tracks'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {tracks.length} tracks
                      </span>
                    </div>
                    {isServiceWorkerReady && tracks.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={async () => {
                          const uncachedTracks = tracks.filter(t => !isTrackCached(t.id));
                          if (uncachedTracks.length === 0) {
                            toast.info("All tracks are already saved offline");
                            return;
                          }
                          toast.info(`Downloading ${uncachedTracks.length} tracks for offline...`);
                          for (const track of uncachedTracks) {
                            await downloadTrack(track.id, track.audio_url, track.title, track.artist || undefined);
                          }
                          toast.success(`${uncachedTracks.length} tracks saved for offline!`);
                        }}
                      >
                        <HardDrive className="w-4 h-4" />
                        <span className="hidden sm:inline">Save All Offline</span>
                      </Button>
                    )}
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
                                accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,audio/*"
                                multiple
                                className="hidden"
                                onChange={handleUploadTracks}
                              />
                              <Button size="sm" variant="outline" asChild>
                                <span className="cursor-pointer">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Tracks
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
                              "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all group",
                              "hover:bg-muted/50 cursor-grab active:cursor-grabbing",
                              currentTrack?.id === track.id && "bg-gold/10 border border-gold/30",
                              dragOverIndex === index && "border-t-2 border-gold"
                            )}
                          >
                            {/* Drag handle - hidden on mobile */}
                            <GripVertical className="hidden sm:block w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            
                            {/* Track number / Playing indicator */}
                            <button 
                              onClick={() => handlePlayTrack(track)}
                              className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center text-muted-foreground flex-shrink-0"
                            >
                              {currentTrack?.id === track.id && isPlaying ? (
                                <SimpleWaveformBars isPlaying={true} barCount={3} />
                              ) : (
                                <>
                                  <span className="text-xs sm:text-sm group-hover:hidden">{index + 1}</span>
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4 hidden group-hover:block" />
                                </>
                              )}
                            </button>
                            
                            {/* Track icon - smaller on mobile */}
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center flex-shrink-0">
                              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gold/70" />
                              {/* Offline indicator */}
                              {isTrackCached(track.id) && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <HardDrive className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            
                            {/* Track info - full width on mobile */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                <p className={cn(
                                  "text-sm sm:text-base font-medium",
                                  currentTrack?.id === track.id && "text-gold"
                                )}>
                                  {track.title}
                                </p>
                                {/* Chief Aim Anthem indicator */}
                                {profile?.chief_aim_song_url === track.audio_url && (
                                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {track.artist || displayName}
                              </p>
                            </div>
                            
                            {/* Duration - hidden on xs */}
                            <span className="hidden xs:block text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                              {track.duration_seconds ? formatTime(track.duration_seconds) : '--:--'}
                            </span>
                            
                            {/* Offline download button - quick access */}
                            {isServiceWorkerReady && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-8 w-8",
                                  isTrackCached(track.id) 
                                    ? "text-green-500" 
                                    : "opacity-0 group-hover:opacity-100"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isTrackCached(track.id)) {
                                    handleRemoveFromOffline(track.id);
                                  } else {
                                    handleDownloadForOffline(track);
                                  }
                                }}
                                disabled={isTrackDownloading(track.id)}
                              >
                                {isTrackDownloading(track.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isTrackCached(track.id) ? (
                                  <HardDrive className="w-4 h-4" />
                                ) : (
                                  <CloudOff className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            
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
                                    Download to Device
                                  </a>
                                </DropdownMenuItem>
                                {isServiceWorkerReady && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {isTrackCached(track.id) ? (
                                      <DropdownMenuItem 
                                        onClick={() => handleRemoveFromOffline(track.id)}
                                      >
                                        <Cloud className="w-4 h-4 mr-2" />
                                        Remove Offline Copy
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem 
                                        onClick={() => handleDownloadForOffline(track)}
                                        disabled={isTrackDownloading(track.id)}
                                      >
                                        {isTrackDownloading(track.id) ? (
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                          <HardDrive className="w-4 h-4 mr-2" />
                                        )}
                                        Save for Offline
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={async () => {
                                    await updateProfile({ chief_aim_song_url: track.audio_url });
                                    toast.success("Set as your Definite Chief Aim Anthem! 🎯");
                                  }}
                                  className={profile?.chief_aim_song_url === track.audio_url ? "text-gold" : ""}
                                >
                                  <Target className="w-4 h-4 mr-2" />
                                  {profile?.chief_aim_song_url === track.audio_url 
                                    ? "✓ Current Chief Aim Anthem" 
                                    : "Use as Chief Aim Anthem"}
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
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 w-full max-w-[100vw] overflow-hidden safe-area-bottom">
        <div className="container mx-auto px-2 sm:px-4 max-w-full">
          {/* Progress bar */}
          <div className="h-1 bg-muted/30 relative overflow-hidden">
            <div 
              className="h-full bg-gold transition-all duration-150"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
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
