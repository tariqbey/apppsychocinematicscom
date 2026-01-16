import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { RadioPlaylist, RadioTrack, FeaturedTrack } from "./useRadio";

export const useRadioAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Playlist management
  const createPlaylist = useCallback(async (name: string, description?: string, coverImageUrl?: string) => {
    if (!user) return null;
    setLoading(true);

    const { data, error } = await supabase
      .from("radio_playlists")
      .insert({
        name,
        description: description || null,
        cover_image_url: coverImageUrl || null,
        created_by: user.id,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      toast.error("Failed to create playlist");
      return null;
    }
    toast.success("Playlist created!");
    return data;
  }, [user]);

  const updatePlaylist = useCallback(async (
    playlistId: string, 
    updates: Partial<Pick<RadioPlaylist, 'name' | 'description' | 'cover_image_url' | 'is_featured' | 'is_active'>>
  ) => {
    setLoading(true);
    const { error } = await supabase
      .from("radio_playlists")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", playlistId);

    setLoading(false);
    if (error) {
      toast.error("Failed to update playlist");
      return false;
    }
    toast.success("Playlist updated!");
    return true;
  }, []);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("radio_playlists")
      .delete()
      .eq("id", playlistId);

    setLoading(false);
    if (error) {
      toast.error("Failed to delete playlist");
      return false;
    }
    toast.success("Playlist deleted!");
    return true;
  }, []);

  // Track management
  const addTrack = useCallback(async (
    playlistId: string,
    title: string,
    audioUrl: string,
    artist?: string,
    durationSeconds?: number,
    sourceType: string = 'admin_upload',
    sourceMediaId?: string
  ) => {
    setLoading(true);

    // Get current max order
    const { data: existingTracks } = await supabase
      .from("radio_playlist_tracks")
      .select("track_order")
      .eq("playlist_id", playlistId)
      .order("track_order", { ascending: false })
      .limit(1);

    const nextOrder = existingTracks && existingTracks.length > 0 
      ? existingTracks[0].track_order + 1 
      : 0;

    const { data, error } = await supabase
      .from("radio_playlist_tracks")
      .insert({
        playlist_id: playlistId,
        title,
        audio_url: audioUrl,
        artist: artist || null,
        duration_seconds: durationSeconds || null,
        track_order: nextOrder,
        source_type: sourceType,
        source_media_id: sourceMediaId || null,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      toast.error("Failed to add track");
      return null;
    }
    toast.success("Track added!");
    return data;
  }, []);

  const updateTrack = useCallback(async (
    trackId: string,
    updates: Partial<Pick<RadioTrack, 'title' | 'artist' | 'audio_url' | 'track_order'>>
  ) => {
    setLoading(true);
    const { error } = await supabase
      .from("radio_playlist_tracks")
      .update(updates)
      .eq("id", trackId);

    setLoading(false);
    if (error) {
      toast.error("Failed to update track");
      return false;
    }
    toast.success("Track updated!");
    return true;
  }, []);

  const deleteTrack = useCallback(async (trackId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("radio_playlist_tracks")
      .delete()
      .eq("id", trackId);

    setLoading(false);
    if (error) {
      toast.error("Failed to delete track");
      return false;
    }
    toast.success("Track removed!");
    return true;
  }, []);

  const reorderTracks = useCallback(async (tracks: RadioTrack[]) => {
    setLoading(true);
    const updates = tracks.map((track, index) => ({
      id: track.id,
      track_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from("radio_playlist_tracks")
        .update({ track_order: update.track_order })
        .eq("id", update.id);
    }

    setLoading(false);
    return true;
  }, []);

  // Featured / Now Playing management
  const setNowPlaying = useCallback(async (
    trackTitle: string,
    audioUrl: string,
    artist?: string
  ) => {
    if (!user) return false;
    setLoading(true);

    // Clear any existing now playing
    await supabase
      .from("radio_featured_tracks")
      .update({ is_now_playing: false })
      .eq("is_now_playing", true);

    // Set new now playing
    const { error } = await supabase
      .from("radio_featured_tracks")
      .insert({
        track_title: trackTitle,
        artist: artist || null,
        audio_url: audioUrl,
        is_now_playing: true,
        featured_by: user.id,
      });

    setLoading(false);
    if (error) {
      toast.error("Failed to set now playing");
      return false;
    }
    toast.success("Now Playing updated!");
    return true;
  }, [user]);

  const clearNowPlaying = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase
      .from("radio_featured_tracks")
      .update({ is_now_playing: false })
      .eq("is_now_playing", true);

    setLoading(false);
    if (error) {
      toast.error("Failed to clear now playing");
      return false;
    }
    toast.success("Now Playing cleared!");
    return true;
  }, []);

  // Fetch all playlists with tracks for admin view
  const fetchAllPlaylistsWithTracks = useCallback(async () => {
    setLoading(true);
    const { data: playlists, error: playlistError } = await supabase
      .from("radio_playlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (playlistError) {
      setLoading(false);
      return [];
    }

    const playlistsWithTracks = await Promise.all(
      (playlists || []).map(async (playlist) => {
        const { data: tracks } = await supabase
          .from("radio_playlist_tracks")
          .select("*")
          .eq("playlist_id", playlist.id)
          .order("track_order", { ascending: true });
        
        return { ...playlist, tracks: tracks || [] };
      })
    );

    setLoading(false);
    return playlistsWithTracks;
  }, []);

  // Fetch user-generated audio for featuring
  const fetchUserGeneratedAudio = useCallback(async () => {
    const { data, error } = await supabase
      .from("generated_media")
      .select("*")
      .eq("media_type", "audio")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return [];
    return data || [];
  }, []);

  return {
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrack,
    updateTrack,
    deleteTrack,
    reorderTracks,
    setNowPlaying,
    clearNowPlaying,
    fetchAllPlaylistsWithTracks,
    fetchUserGeneratedAudio,
  };
};
