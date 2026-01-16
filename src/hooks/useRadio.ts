import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RadioStation {
  id: string;
  name: string;
  description: string | null;
  stream_url: string | null;
  is_live: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface RadioPlaylist {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface RadioTrack {
  id: string;
  playlist_id: string;
  audio_url: string;
  title: string;
  artist: string | null;
  duration_seconds: number | null;
  track_order: number;
  source_type: string;
  source_media_id: string | null;
  created_at: string;
}

export interface FeaturedTrack {
  id: string;
  track_title: string;
  artist: string | null;
  audio_url: string;
  is_now_playing: boolean;
  featured_at: string;
  featured_by: string | null;
}

export const useRadio = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [playlists, setPlaylists] = useState<RadioPlaylist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<RadioPlaylist | null>(null);
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [nowPlaying, setNowPlaying] = useState<FeaturedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchPlaylists();
    fetchNowPlaying();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const setupRealtimeSubscription = () => {
    channelRef.current = supabase
      .channel('radio_now_playing')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_featured_tracks',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const track = payload.new as FeaturedTrack;
            if (track.is_now_playing) {
              setNowPlaying(track);
            }
          }
        }
      )
      .subscribe();
  };

  const fetchPlaylists = async () => {
    const { data, error } = await supabase
      .from("radio_playlists")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false });

    if (!error && data) {
      setPlaylists(data);
    }
    setLoading(false);
  };

  const fetchNowPlaying = async () => {
    const { data, error } = await supabase
      .from("radio_featured_tracks")
      .select("*")
      .eq("is_now_playing", true)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setNowPlaying(data);
    }
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    const { data, error } = await supabase
      .from("radio_playlist_tracks")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("track_order", { ascending: true });

    if (!error && data) {
      setTracks(data);
    }
  };

  const selectPlaylist = async (playlist: RadioPlaylist) => {
    setCurrentPlaylist(playlist);
    await fetchPlaylistTracks(playlist.id);
  };

  const playTrack = useCallback((track: RadioTrack | FeaturedTrack) => {
    if (audioRef.current) {
      audioRef.current.src = track.audio_url;
      audioRef.current.volume = volume;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return {
    stations,
    playlists,
    currentPlaylist,
    tracks,
    nowPlaying,
    isPlaying,
    volume,
    currentTime,
    duration,
    loading,
    audioRef,
    fetchPlaylists,
    fetchNowPlaying,
    fetchPlaylistTracks,
    selectPlaylist,
    playTrack,
    togglePlay,
    handleVolumeChange,
    handleSeek,
  };
};
