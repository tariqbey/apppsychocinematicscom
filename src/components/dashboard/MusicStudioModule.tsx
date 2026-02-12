import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Heart, ListMusic, Upload, X, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserPlaylists, type PlaylistTrack } from "@/hooks/useUserPlaylists";
import { useAudioOptional } from "@/hooks/useGlobalAudio";
import { useMediaSession, configureAudioForBackground, useIOSBackgroundAudio } from "@/hooks/useMediaSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import iconSoundtrack from "@/assets/icons/icon-soundtrack.png";

interface MusicStudioModuleProps {
  className?: string;
}

export function MusicStudioModule({ className }: MusicStudioModuleProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const lastPlayedTrackIdRef = useRef<string | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

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
    fetchPlaylistTracks,
  } = useUserPlaylists();

  const globalAudio = useAudioOptional();

  // Stop global audio when player opens
  useEffect(() => {
    if (isOpen && globalAudio?.isPlaying) {
      globalAudio.stopAudio();
    }
  }, [isOpen]);

  // Init audio element
  useEffect(() => {
    if (!isOpen) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    const cleanup = configureAudioForBackground(audioRef.current);
    setIsAudioReady(true);
    return cleanup;
  }, [isOpen]);

  // Sync volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  // Pause sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isPlaying && !audio.paused) audio.pause();
  }, [isPlaying]);

  // Auto-advance
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAudioReady || !currentTrack) return;
    if (lastPlayedTrackIdRef.current && lastPlayedTrackIdRef.current !== currentTrack.id && isPlaying) {
      audio.src = currentTrack.audio_url;
      currentAudioUrlRef.current = currentTrack.audio_url;
      audio.currentTime = 0;
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(() => setIsPlaying(false));
    }
    lastPlayedTrackIdRef.current = currentTrack.id;
  }, [currentTrack, isAudioReady, isPlaying, volume, isMuted, setIsPlaying]);

  // Audio events
  useEffect(() => {
    if (!isAudioReady) return;
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      if (isRepeat) { audio.currentTime = 0; audio.play().catch(console.error); }
      else playNextTrack();
    };
    const onErr = () => { toast.error("Error playing track"); setIsPlaying(false); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  }, [isAudioReady, isRepeat, playNextTrack, setIsPlaying]);

  useIOSBackgroundAudio(audioRef, isPlaying);

  const handleSeekTo = useCallback((time: number) => {
    if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); }
  }, []);

  useMediaSession({
    title: currentTrack?.title,
    artist: currentTrack?.artist || "Music Studio",
    album: currentPlaylist?.name || "Music Studio",
    isPlaying,
    duration,
    currentTime,
    audioElement: audioRef.current,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onNextTrack: playNextTrack,
    onPreviousTrack: playPreviousTrack,
    onSeekTo: handleSeekTo,
  });

  const handlePlayTrack = async (track: PlaylistTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else {
        audio.muted = false;
        audio.volume = volume > 0 ? volume : 0.8;
        await audio.play().catch(() => toast.error("Tap again to play"));
        setIsPlaying(true);
      }
      return;
    }
    playTrack(track);
    audio.src = track.audio_url;
    currentAudioUrlRef.current = track.audio_url;
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = volume > 0 ? volume : 0.8;
    try { await audio.play(); setIsPlaying(true); }
    catch { toast.error("Tap again to play"); }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentTrack) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else {
        audio.muted = false; audio.volume = volume > 0 ? volume : 0.8;
        try { await audio.play(); setIsPlaying(true); } catch { toast.error("Tap again"); }
      }
    } else if (tracks.length > 0) await handlePlayTrack(tracks[0]);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const handleUploadTracks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    const audioExt = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
    const valid = Array.from(files).filter(f => f.type.startsWith("audio/") || audioExt.test(f.name));
    if (valid.length === 0) { toast.error("Please upload audio files"); return; }
    const playlist = currentPlaylist || await getDefaultPlaylist();
    if (!playlist) { toast.error("No playlist available"); return; }
    let ok = 0;
    for (const file of valid) {
      try {
        const name = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("generated-media").upload(name, file, { cacheControl: "3600", upsert: true, contentType: file.type || "audio/mpeg" });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("generated-media").getPublicUrl(name);
        await addTrackToPlaylist(playlist.id, { title: file.name.replace(/\.[^/.]+$/, ""), audio_url: publicUrl, source_type: "upload" });
        ok++;
      } catch { /* skip */ }
    }
    if (ok > 0) { toast.success(`${ok} track${ok > 1 ? "s" : ""} uploaded!`); await fetchPlaylistTracks(playlist.id); }
    e.target.value = "";
  };

  // Progress percentage for the vinyl animation
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Module Card */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full relative group text-left overflow-hidden rounded-xl border transition-all duration-400 ease-out",
          "border-pink-400/15 hover:border-pink-400/40",
          "active:scale-[0.98] hover:translate-y-[-2px]",
          className
        )}
        style={{
          background: "linear-gradient(135deg, hsl(240 5% 8%) 0%, hsl(330 81% 60% / 0.04) 50%, hsl(240 5% 8%) 100%)",
        }}
      >
        {/* Persistent glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 10% 50%, hsl(330 81% 60% / 0.06) 0%, transparent 60%)",
        }} />
        {/* Breathing shimmer */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(330 81% 60% / 0.04) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "calendar-shimmer 5s ease-in-out infinite",
        }} />
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
          background: "linear-gradient(90deg, transparent, hsl(330 81% 60% / 0.4), transparent)",
        }} />
        {/* Left bar */}
        <div className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full" style={{
          background: "linear-gradient(to bottom, transparent, hsl(330 81% 60% / 0.5), transparent)",
        }} />

        <div className="relative z-10 p-5 sm:p-6 flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-pink-500/25 to-pink-500/8"
            style={{ boxShadow: "0 0 12px hsl(330 81% 60% / 0.15)" }}
          >
            <img src={iconSoundtrack} alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg sm:text-xl tracking-wide text-pink-400 group-hover:text-pink-300 transition-colors">
              Music Studio
            </h3>
            <p className="font-ui text-xs text-muted-foreground line-clamp-1 opacity-70">
              Create & play your transformation soundtrack
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground group-hover:text-pink-400 transition-colors">
            <Headphones className="w-4 h-4" />
            <span>Open</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="h-full w-0 group-hover:w-full transition-all duration-700 ease-out"
            style={{ background: "hsl(330 81% 60%)", boxShadow: "0 0 8px hsl(330 81% 60% / 0.3)" }}
          />
        </div>
      </button>

      {/* Music Player Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg p-0 bg-[hsl(240_5%_6%)] border-pink-500/20 overflow-hidden rounded-2xl gap-0 [&>button:last-child]:hidden">
          {/* Header with back button */}
          <div className="flex items-center justify-between px-4 pt-4 pb-0 relative z-20">
            <button onClick={() => setIsOpen(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-lg">←</span>
              <span>Back</span>
            </button>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Music Studio</span>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Album Art / Vinyl Section */}
          <div className="relative px-8 pt-10 pb-6 flex flex-col items-center"
            style={{
              background: "radial-gradient(ellipse at 50% 30%, hsl(330 81% 60% / 0.12) 0%, transparent 70%)",
            }}
          >
            {/* Spinning vinyl */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 mb-6">
              {/* Outer ring glow */}
              <div className="absolute inset-0 rounded-full" style={{
                background: "conic-gradient(from 0deg, hsl(330 81% 60% / 0.15), hsl(37 87% 57% / 0.1), hsl(330 81% 60% / 0.15))",
                filter: "blur(8px)",
                animation: isPlaying ? "spin 3s linear infinite" : "none",
              }} />
              {/* Vinyl disc */}
              <div
                className="absolute inset-2 rounded-full border-2 border-white/5"
                style={{
                  background: `
                    radial-gradient(circle at center, hsl(330 81% 60% / 0.3) 0%, hsl(240 5% 12%) 25%, hsl(240 5% 8%) 35%, hsl(240 5% 12%) 45%, hsl(240 5% 8%) 55%, hsl(240 5% 10%) 100%)
                  `,
                  animation: isPlaying ? "spin 3s linear infinite" : "none",
                  boxShadow: "inset 0 0 30px rgba(0,0,0,0.5), 0 0 20px hsl(330 81% 60% / 0.1)",
                }}
              >
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pink-500/40 to-gold/30 flex items-center justify-center border border-white/10">
                    <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" />
                  </div>
                </div>
              </div>
              {/* Grooves */}
              {[30, 40, 50, 60, 70, 80].map(r => (
                <div key={r} className="absolute rounded-full border border-white/[0.03] pointer-events-none"
                  style={{
                    inset: `${(100 - r) / 2}%`,
                    animation: isPlaying ? "spin 3s linear infinite" : "none",
                  }}
                />
              ))}
            </div>

            {/* Track info */}
            <h3 className="text-lg font-display text-foreground text-center truncate w-full px-4">
              {currentTrack?.title || "No Track Selected"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currentTrack?.artist || "Music Studio"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-8 py-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={(v) => handleSeekTo(v[0])}
              className="w-full [&_[role=slider]]:bg-pink-400 [&_[role=slider]]:border-pink-400 [&_.bg-primary]:bg-pink-400"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 pb-4 flex items-center justify-center gap-4">
            <button onClick={() => setIsShuffle(!isShuffle)}
              className={cn("p-2 rounded-full transition-colors", isShuffle ? "text-pink-400" : "text-muted-foreground hover:text-foreground")}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={playPreviousTrack} className="p-2 text-foreground hover:text-pink-400 transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_25px_hsl(330_81%_60%/0.4)]"
            >
              {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
            </button>
            <button onClick={playNextTrack} className="p-2 text-foreground hover:text-pink-400 transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
            <button onClick={() => setIsRepeat(!isRepeat)}
              className={cn("p-2 rounded-full transition-colors", isRepeat ? "text-pink-400" : "text-muted-foreground hover:text-foreground")}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="px-8 pb-4 flex items-center gap-3">
            <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0} max={1} step={0.01}
              onValueChange={(v) => { setVolume(v[0]); setIsMuted(v[0] === 0); }}
              className="flex-1 [&_[role=slider]]:bg-pink-400 [&_[role=slider]]:border-pink-400 [&_.bg-primary]:bg-pink-400"
            />
          </div>

          {/* Track list */}
          <div className="border-t border-white/5">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ListMusic className="w-4 h-4" />
                <span>{tracks.length} tracks</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="audio/*" multiple onChange={handleUploadTracks} className="hidden" />
                  <div className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </div>
                </label>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7"
                  onClick={() => { setIsOpen(false); navigate("/score"); }}
                >
                  Full Player →
                </Button>
              </div>
            </div>
            <ScrollArea className="max-h-48">
              {tracks.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No tracks yet. Upload some music!</p>
                </div>
              ) : (
                <div className="px-2 pb-3">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors",
                        currentTrack?.id === track.id
                          ? "bg-pink-500/10 text-pink-400"
                          : "hover:bg-white/5 text-foreground"
                      )}
                    >
                      <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <div className="flex items-end gap-[2px] h-4">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-[3px] bg-pink-400 rounded-full" style={{
                                animation: `equalizer-bar 0.${4 + i}s ease-in-out infinite alternate`,
                                height: `${8 + i * 3}px`,
                              }} />
                            ))}
                          </div>
                        ) : (
                          <Music className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist || "Unknown"}</p>
                      </div>
                      {track.duration_seconds && (
                        <span className="text-xs text-muted-foreground">{formatTime(track.duration_seconds)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Sub-modules: Director Radio, The Score, Soundtrack Studio */}
          <div className="px-4 py-3 border-t border-white/5 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-2">Music Modules</p>
            <button
              onClick={() => { setIsOpen(false); navigate("/radio"); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gold/5 border border-gold/10 hover:border-gold/30 transition-all group/item"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gold group-hover/item:text-gold">Director Radio</p>
                <p className="text-xs text-muted-foreground">Curated stations & live broadcasts</p>
              </div>
              <span className="text-xs text-muted-foreground group-hover/item:text-gold transition-colors">→</span>
            </button>
            <button
              onClick={() => { setIsOpen(false); navigate("/score"); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-all group/item"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                <ListMusic className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-amber-400 group-hover/item:text-amber-300">The Score</p>
                <p className="text-xs text-muted-foreground">Full music library & playlists</p>
              </div>
              <span className="text-xs text-muted-foreground group-hover/item:text-amber-400 transition-colors">→</span>
            </button>
            <button
              onClick={() => { setIsOpen(false); navigate("/soundtrack"); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-500/5 border border-pink-500/10 hover:border-pink-500/30 transition-all group/item"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-pink-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-pink-400 group-hover/item:text-pink-300">Soundtrack Studio</p>
                <p className="text-xs text-muted-foreground">Create custom AI music & lyrics</p>
              </div>
              <span className="text-xs text-muted-foreground group-hover/item:text-pink-400 transition-colors">→</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
