import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useUserPlaylists, Playlist, PlaylistTrack } from "@/hooks/useUserPlaylists";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  List,
  Clock,
  Trash2,
  Plus,
  Shuffle,
  Repeat
} from "lucide-react";

interface UserPlaylistPlayerProps {
  className?: string;
  compact?: boolean;
}

export function UserPlaylistPlayer({ className, compact = false }: UserPlaylistPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

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
    removeTrackFromPlaylist,
    setIsPlaying,
    setCurrentTrack,
  } = useUserPlaylists();

  // Handle audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.audio_url;
    audio.volume = isMuted ? 0 : volume / 100;

    if (isPlaying) {
      audio.play().catch(console.error);
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
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
  }, [currentTrack, isPlaying, volume, isMuted, isRepeat, playNextTrack]);

  // Play/pause effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Volume effect
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = (track: PlaylistTrack) => {
    if (currentTrack?.id === track.id) {
      isPlaying ? pauseTrack() : setIsPlaying(true);
    } else {
      playTrack(track);
    }
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <audio ref={audioRef} />
          
          {currentTrack ? (
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="gold"
                className="h-12 w-12 rounded-full flex-shrink-0"
                onClick={() => isPlaying ? pauseTrack() : setIsPlaying(true)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist || 'AI Generated'}</p>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={playPreviousTrack}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={playNextTrack}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Music className="w-5 h-5" />
              <span className="text-sm">No track playing</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <audio ref={audioRef} />
      
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="w-5 h-5 text-gold" />
          My Transformation Tracks
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Now Playing */}
        {currentTrack && (
          <Card className="p-4 bg-gradient-to-br from-gold/10 to-transparent border-gold/30">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Music className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{currentTrack.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {currentTrack.artist || 'AI Generated'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${isShuffled ? 'text-gold' : ''}`}
                  onClick={() => setIsShuffled(!isShuffled)}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={playPreviousTrack}>
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="gold"
                  className="h-12 w-12 rounded-full"
                  onClick={() => isPlaying ? pauseTrack() : setIsPlaying(true)}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={playNextTrack}>
                  <SkipForward className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${isRepeat ? 'text-gold' : ''}`}
                  onClick={() => setIsRepeat(!isRepeat)}
                >
                  <Repeat className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={(v) => {
                    setVolume(v[0]);
                    setIsMuted(false);
                  }}
                  className="w-24"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Playlist selector */}
        {playlists.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <List className="w-4 h-4" />
                {currentPlaylist?.name || 'Select Playlist'}
              </Label>
              <Badge variant="outline">{tracks.length} tracks</Badge>
            </div>
          </div>
        )}

        {/* Track list */}
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {tracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tracks yet</p>
                <p className="text-xs mt-1">Generate soundtracks from your challenges and episodes</p>
              </div>
            ) : (
              tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    currentTrack?.id === track.id 
                      ? 'bg-gold/10 border border-gold/30' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleTrackClick(track)}
                >
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-gold animate-pulse" />
                        <div className="w-0.5 h-4 bg-gold animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 h-2 bg-gold animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist || 'AI Generated'}
                    </p>
                  </div>

                  {track.duration_seconds && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(track.duration_seconds)}
                    </span>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrackFromPlaylist(track.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Simple Label component if not imported
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
