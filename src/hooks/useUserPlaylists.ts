import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_default: boolean;
  track_count: number;
  total_duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  user_id: string;
  title: string;
  artist: string | null;
  audio_url: string;
  duration_seconds: number | null;
  source_type: string;
  source_id: string | null;
  metadata: Record<string, any>;
  track_order: number | null;
  created_at: string;
}

export function useUserPlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<PlaylistTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const initializedRef = useRef(false);

  // Fetch tracks for a playlist
  const fetchPlaylistTracks = useCallback(async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_playlist_tracks')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('track_order', { ascending: true });

      if (error) throw error;
      
      setTracks((data || []) as PlaylistTrack[]);
      return (data || []) as PlaylistTrack[];
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }, []);

  // Create a new playlist
  const createPlaylist = useCallback(async (
    name: string, 
    description?: string, 
    isDefault = false
  ): Promise<Playlist | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('user_playlists')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          is_default: isDefault,
        })
        .select()
        .single();

      if (error) throw error;
      
      const playlist = data as Playlist;
      setPlaylists(prev => [playlist, ...prev]);
      return playlist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
      return null;
    }
  }, [user]);

  // Fetch all user playlists and auto-load tracks from default
  const fetchPlaylists = useCallback(async (autoLoadTracks = true) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      let fetchedPlaylists = (data || []) as Playlist[];
      
      // Auto-create default playlist if none exist
      if (fetchedPlaylists.length === 0) {
        const defaultPlaylist = await createPlaylist('My Transformation Tracks', 'Your personal collection of generated songs', true);
        if (defaultPlaylist) {
          fetchedPlaylists = [defaultPlaylist];
        }
      }
      
      setPlaylists(fetchedPlaylists);
      
      // Auto-select the default playlist and load its tracks
      if (autoLoadTracks && fetchedPlaylists.length > 0) {
        const defaultPlaylist = fetchedPlaylists.find(p => p.is_default) || fetchedPlaylists[0];
        if (defaultPlaylist) {
          setCurrentPlaylist(defaultPlaylist);
          await fetchPlaylistTracks(defaultPlaylist.id);
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, createPlaylist, fetchPlaylistTracks]);

  // Delete a playlist
  const deletePlaylist = useCallback(async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('user_playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;
      
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist(null);
        setTracks([]);
      }
      toast.success('Playlist deleted');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  }, [currentPlaylist]);

  // Select a playlist and load its tracks
  const selectPlaylist = useCallback(async (playlist: Playlist) => {
    setCurrentPlaylist(playlist);
    await fetchPlaylistTracks(playlist.id);
  }, [fetchPlaylistTracks]);

  // Add a track to a playlist
  const addTrackToPlaylist = useCallback(async (
    playlistId: string,
    track: {
      title: string;
      artist?: string;
      audio_url: string;
      duration_seconds?: number;
      source_type?: string;
      source_id?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<PlaylistTrack | null> => {
    if (!user) return null;
    
    try {
      // Get current track count for ordering
      const { count } = await supabase
        .from('user_playlist_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

      const { data, error } = await supabase
        .from('user_playlist_tracks')
        .insert({
          playlist_id: playlistId,
          user_id: user.id,
          title: track.title,
          artist: track.artist || null,
          audio_url: track.audio_url,
          duration_seconds: track.duration_seconds || null,
          source_type: track.source_type || 'generated',
          source_id: track.source_id || null,
          metadata: track.metadata || {},
          track_order: (count || 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTrack = data as PlaylistTrack;
      
      // Update local state if this is the current playlist
      if (currentPlaylist?.id === playlistId) {
        setTracks(prev => [...prev, newTrack]);
      }
      
      // Refresh playlists to get updated counts
      await fetchPlaylists(false);
      
      toast.success(`Added "${track.title}" to playlist`);
      return newTrack;
    } catch (error) {
      console.error('Error adding track:', error);
      toast.error('Failed to add track to playlist');
      return null;
    }
  }, [user, currentPlaylist, fetchPlaylists]);

  // Remove a track from a playlist
  const removeTrackFromPlaylist = useCallback(async (trackId: string) => {
    try {
      const { error } = await supabase
        .from('user_playlist_tracks')
        .delete()
        .eq('id', trackId);

      if (error) throw error;
      
      setTracks(prev => prev.filter(t => t.id !== trackId));
      await fetchPlaylists(false);
      toast.success('Track removed from playlist');
    } catch (error) {
      console.error('Error removing track:', error);
      toast.error('Failed to remove track');
    }
  }, [fetchPlaylists]);

  // Get the default playlist (or first one)
  const getDefaultPlaylist = useCallback(async (): Promise<Playlist | null> => {
    if (!user) return null;
    
    // Check local state first
    const defaultPlaylist = playlists.find(p => p.is_default) || playlists[0];
    if (defaultPlaylist) return defaultPlaylist;
    
    // Fetch from database
    const { data, error } = await supabase
      .from('user_playlists')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Create default if none exists
      return await createPlaylist('My Transformation Tracks', 'Your personal collection of generated songs', true);
    }
    
    return data as Playlist;
  }, [user, playlists, createPlaylist]);

  // Play a track
  const playTrack = useCallback((track: PlaylistTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  // Pause playback
  const pauseTrack = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Play next track
  const playNextTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(true);
  }, [currentTrack, tracks]);

  // Play previous track
  const playPreviousTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
    setCurrentTrack(tracks[prevIndex]);
    setIsPlaying(true);
  }, [currentTrack, tracks]);

  // Initial fetch - only run once per mount
  useEffect(() => {
    if (user && !initializedRef.current) {
      initializedRef.current = true;
      fetchPlaylists(true);
    }
  }, [user, fetchPlaylists]);

  // Reset when user changes
  useEffect(() => {
    if (!user) {
      initializedRef.current = false;
      setPlaylists([]);
      setTracks([]);
      setCurrentPlaylist(null);
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, [user]);

  return {
    playlists,
    currentPlaylist,
    tracks,
    currentTrack,
    isPlaying,
    isLoading,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    selectPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getDefaultPlaylist,
    playTrack,
    pauseTrack,
    playNextTrack,
    playPreviousTrack,
    setIsPlaying,
    setCurrentTrack,
    fetchPlaylistTracks,
  };
}
