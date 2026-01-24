import { useState, useEffect, useRef } from "react";
import { 
  Radio, Plus, Music, Trash2, Edit, Play, Pause, 
  Upload, ExternalLink, Star, ListMusic, Volume2, 
  Podcast, Link, CheckCircle, XCircle, Clock, Send,
  SkipBack, SkipForward, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRadioAdmin } from "@/hooks/useRadioAdmin";
import type { RadioPlaylist, RadioTrack } from "@/hooks/useRadio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RadioMusicUpload } from "./RadioMusicUpload";

interface PlaylistWithTracks extends RadioPlaylist {
  tracks: RadioTrack[];
}

interface RadioSubmission {
  id: string;
  user_id: string;
  media_id: string;
  track_title: string;
  artist_name: string | null;
  audio_url: string;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
}

interface RadioStation {
  id: string;
  name: string;
  description: string | null;
  stream_url: string | null;
  source_type: string;
  is_live: boolean;
  is_active: boolean;
}

export const RadioManager = () => {
  const {
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrack,
    deleteTrack,
    setNowPlaying,
    clearNowPlaying,
    fetchAllPlaylistsWithTracks,
    fetchUserGeneratedAudio,
  } = useRadioAdmin();

  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [userAudio, setUserAudio] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [showAddStreamDialog, setShowAddStreamDialog] = useState(false);
  const [currentNowPlaying, setCurrentNowPlaying] = useState<any>(null);
  const [submissions, setSubmissions] = useState<RadioSubmission[]>([]);
  const [streams, setStreams] = useState<RadioStation[]>([]);

  // ---------- LOCAL PLAYBACK STATE ----------
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [localTrack, setLocalTrack] = useState<{ title: string; artist?: string; url: string } | null>(null);
  const [localTime, setLocalTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [localVolume, setLocalVolume] = useState(0.8);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);

  // New playlist form
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");

  // New track form
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackArtist, setNewTrackArtist] = useState("");
  const [newTrackUrl, setNewTrackUrl] = useState("");

  // New stream form
  const [newStreamName, setNewStreamName] = useState("");
  const [newStreamUrl, setNewStreamUrl] = useState("");
  const [newStreamType, setNewStreamType] = useState<string>("podcast");
  const [newStreamDescription, setNewStreamDescription] = useState("");

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = localVolume;
    }
    const audio = audioRef.current;
    const onTime = () => setLocalTime(audio.currentTime);
    const onDur = () => setLocalDuration(audio.duration || 0);
    const onEnd = () => {
      setLocalPlaying(false);
      // Auto-advance
      if (selectedPlaylist && currentTrackIndex >= 0 && currentTrackIndex < selectedPlaylist.tracks.length - 1) {
        const next = selectedPlaylist.tracks[currentTrackIndex + 1];
        handleLocalPlay(next.title, next.audio_url, next.artist || undefined, currentTrackIndex + 1);
      }
    };
    const onPlay = () => setLocalPlaying(true);
    const onPause = () => setLocalPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [selectedPlaylist, currentTrackIndex]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = localVolume;
  }, [localVolume]);

  const handleLocalPlay = (title: string, url: string, artist?: string, idx?: number) => {
    if (!audioRef.current) return;
    setLocalTrack({ title, artist, url });
    if (typeof idx === "number") setCurrentTrackIndex(idx);
    audioRef.current.src = url;
    audioRef.current.play().catch(console.error);
  };

  const toggleLocalPlay = () => {
    if (!audioRef.current) return;
    if (localPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setLocalTime(val);
    }
  };

  const handlePrev = () => {
    if (!selectedPlaylist || currentTrackIndex <= 0) return;
    const prev = selectedPlaylist.tracks[currentTrackIndex - 1];
    handleLocalPlay(prev.title, prev.audio_url, prev.artist || undefined, currentTrackIndex - 1);
  };

  const handleNext = () => {
    if (!selectedPlaylist || currentTrackIndex < 0 || currentTrackIndex >= selectedPlaylist.tracks.length - 1) return;
    const next = selectedPlaylist.tracks[currentTrackIndex + 1];
    handleLocalPlay(next.title, next.audio_url, next.artist || undefined, currentTrackIndex + 1);
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setLocalPlaying(false);
    setLocalTrack(null);
    setCurrentTrackIndex(-1);
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [playlistsData, audioData, nowPlayingData, submissionsData, streamsData] = await Promise.all([
      fetchAllPlaylistsWithTracks(),
      fetchUserGeneratedAudio(),
      supabase.from("radio_featured_tracks").select("*").eq("is_now_playing", true).maybeSingle(),
      supabase.from("radio_submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("radio_stations").select("*").order("created_at", { ascending: false }),
    ]);
    setPlaylists(playlistsData);
    setUserAudio(audioData);
    if (nowPlayingData.data) {
      setCurrentNowPlaying(nowPlayingData.data);
    }
    setSubmissions((submissionsData.data || []) as RadioSubmission[]);
    setStreams((streamsData.data || []) as RadioStation[]);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    const result = await createPlaylist(newPlaylistName, newPlaylistDescription);
    if (result) {
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setShowCreateDialog(false);
      loadData();
    }
  };

  const handleAddTrack = async () => {
    if (!selectedPlaylist || !newTrackTitle.trim() || !newTrackUrl.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    const result = await addTrack(
      selectedPlaylist.id,
      newTrackTitle,
      newTrackUrl,
      newTrackArtist
    );
    if (result) {
      setNewTrackTitle("");
      setNewTrackArtist("");
      setNewTrackUrl("");
      setShowAddTrackDialog(false);
      loadData();
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await deletePlaylist(playlistId);
      setSelectedPlaylist(null);
      loadData();
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    await deleteTrack(trackId);
    loadData();
  };

  const handleSetNowPlaying = async (title: string, url: string, artist?: string) => {
    await setNowPlaying(title, url, artist);
    loadData();
  };

  const handleClearNowPlaying = async () => {
    await clearNowPlaying();
    setCurrentNowPlaying(null);
    loadData();
  };

  const handleToggleFeatured = async (playlist: PlaylistWithTracks) => {
    await updatePlaylist(playlist.id, { is_featured: !playlist.is_featured });
    loadData();
  };

  const handleAddUserAudioToPlaylist = async (audio: any) => {
    if (!selectedPlaylist) return;
    await addTrack(
      selectedPlaylist.id,
      audio.prompt?.substring(0, 50) || "Generated Track",
      audio.media_url,
      "User Generated",
      undefined,
      "user_generated",
      audio.id
    );
    loadData();
    toast.success("Track added to playlist!");
  };

  // Submission handlers
  const handleApproveSubmission = async (submission: RadioSubmission) => {
    if (!selectedPlaylist) {
      toast.error("Please select a playlist first");
      return;
    }

    // Add track to playlist
    await addTrack(
      selectedPlaylist.id,
      submission.track_title,
      submission.audio_url,
      submission.artist_name || "Community Director",
      undefined,
      "user_submission",
      submission.media_id
    );

    // Update submission status
    await supabase
      .from("radio_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", submission.id);

    loadData();
    toast.success("Submission approved and added to playlist!");
  };

  const handleRejectSubmission = async (submissionId: string) => {
    await supabase
      .from("radio_submissions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", submissionId);

    loadData();
    toast.success("Submission rejected");
  };

  // Podcast/Stream handlers
  const handleAddStream = async () => {
    if (!newStreamName.trim() || !newStreamUrl.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("radio_stations").insert({
      name: newStreamName.trim(),
      stream_url: newStreamUrl.trim(),
      source_type: newStreamType,
      description: newStreamDescription.trim() || null,
      is_active: true,
      is_live: false,
    });

    if (error) {
      toast.error("Failed to add stream");
      return;
    }

    setNewStreamName("");
    setNewStreamUrl("");
    setNewStreamDescription("");
    setShowAddStreamDialog(false);
    loadData();
    toast.success("Stream/Podcast added!");
  };

  const handleDeleteStream = async (streamId: string) => {
    if (confirm("Delete this stream?")) {
      await supabase.from("radio_stations").delete().eq("id", streamId);
      loadData();
      toast.success("Stream deleted");
    }
  };

  const handlePlayStream = async (stream: RadioStation) => {
    if (!stream.stream_url) return;
    await setNowPlaying(stream.name, stream.stream_url, stream.source_type === "podcast" ? "Podcast" : "Live Stream");
    loadData();
  };

  return (
    <Card className="border-gold/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-600/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-gold" />
            </div>
            <div>
              <CardTitle>Internet Radio Manager</CardTitle>
              <CardDescription>Manage playlists, tracks, and streaming content</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="playlists" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="playlists">
              <ListMusic className="w-4 h-4 mr-2" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="streams">
              <Podcast className="w-4 h-4 mr-2" />
              Streams
            </TabsTrigger>
            <TabsTrigger value="submissions">
              <Send className="w-4 h-4 mr-2" />
              Submissions
              {submissions.filter(s => s.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {submissions.filter(s => s.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="now-playing">
              <Volume2 className="w-4 h-4 mr-2" />
              Now Playing
            </TabsTrigger>
            <TabsTrigger value="user-audio">
              <Music className="w-4 h-4 mr-2" />
              User Audio
            </TabsTrigger>
          </TabsList>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">All Playlists</h3>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button variant="gold" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Playlist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Playlist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Playlist Name</Label>
                      <Input
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="e.g., Morning Motivation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newPlaylistDescription}
                        onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        placeholder="Describe this playlist..."
                      />
                    </div>
                    <Button onClick={handleCreatePlaylist} disabled={loading} className="w-full">
                      Create Playlist
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Local Audio Player Bar */}
            {localTrack && (
              <Card className="bg-gradient-to-r from-primary/10 via-gold/10 to-transparent border-gold/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={handlePrev}
                        disabled={currentTrackIndex <= 0}
                      >
                        <SkipBack className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-gold/50 hover:bg-gold/20"
                        onClick={toggleLocalPlay}
                      >
                        {localPlaying ? (
                          <Pause className="w-6 h-6 text-gold" />
                        ) : (
                          <Play className="w-6 h-6 text-gold ml-0.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={handleNext}
                        disabled={!selectedPlaylist || currentTrackIndex >= selectedPlaylist.tracks.length - 1}
                      >
                        <SkipForward className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive"
                        onClick={stopPlayback}
                        title="Stop"
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">{localTrack.title}</p>
                          {localTrack.artist && (
                            <p className="text-xs text-muted-foreground truncate">{localTrack.artist}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatTime(localTime)} / {formatTime(localDuration)}
                        </div>
                      </div>
                      <Slider
                        value={[localTime]}
                        max={localDuration || 100}
                        step={0.1}
                        onValueChange={([v]) => handleSeek(v)}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <Slider
                        value={[localVolume * 100]}
                        max={100}
                        step={1}
                        onValueChange={([v]) => setLocalVolume(v / 100)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Playlist List */}
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {playlists.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No playlists yet. Create one to get started.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => setSelectedPlaylist(playlist)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          selectedPlaylist?.id === playlist.id
                            ? "bg-gold/20 border border-gold/30"
                            : "hover:bg-muted/20"
                        }`}
                      >
                        <div className="w-10 h-10 rounded bg-muted/20 flex items-center justify-center">
                          <Music className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{playlist.name}</p>
                            {playlist.is_featured && (
                              <Star className="w-4 h-4 text-gold fill-gold" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {playlist.tracks.length} tracks
                          </p>
                        </div>
                        {/* Play entire playlist */}
                        {playlist.tracks.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlaylist(playlist);
                              const first = playlist.tracks[0];
                              handleLocalPlay(first.title, first.audio_url, first.artist || undefined, 0);
                            }}
                            title="Play Playlist"
                          >
                            <Play className="w-4 h-4 text-gold" />
                          </Button>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Selected Playlist Details */}
              <div className="border rounded-lg p-4">
                {selectedPlaylist ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{selectedPlaylist.name}</h4>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedPlaylist.is_featured}
                          onCheckedChange={() => handleToggleFeatured(selectedPlaylist)}
                        />
                        <Label className="text-sm">Featured</Label>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {/* Stream Playlist - broadcasts first track to all users */}
                      {selectedPlaylist.tracks.length > 0 && (
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={async () => {
                            const first = selectedPlaylist.tracks[0];
                            // Start local preview AND broadcast to all users
                            handleLocalPlay(first.title, first.audio_url, first.artist || undefined, 0);
                            await handleSetNowPlaying(first.title, first.audio_url, first.artist || undefined);
                            toast.success(`Now streaming "${first.title}" to all users!`);
                          }}
                        >
                          <Radio className="w-4 h-4 mr-1" />
                          Stream Playlist
                        </Button>
                      )}
                      {/* Preview All - plays locally without broadcasting */}
                      {selectedPlaylist.tracks.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const first = selectedPlaylist.tracks[0];
                            handleLocalPlay(first.title, first.audio_url, first.artist || undefined, 0);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Preview All
                        </Button>
                      )}
                      <Dialog open={showAddTrackDialog} onOpenChange={setShowAddTrackDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Add Track
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Track to {selectedPlaylist.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Track Title *</Label>
                              <Input
                                value={newTrackTitle}
                                onChange={(e) => setNewTrackTitle(e.target.value)}
                                placeholder="Enter track title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Artist</Label>
                              <Input
                                value={newTrackArtist}
                                onChange={(e) => setNewTrackArtist(e.target.value)}
                                placeholder="Enter artist name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Audio URL *</Label>
                              <Input
                                value={newTrackUrl}
                                onChange={(e) => setNewTrackUrl(e.target.value)}
                                placeholder="https://..."
                              />
                            </div>
                            <Button onClick={handleAddTrack} disabled={loading} className="w-full">
                              Add Track
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Music Upload from Computer */}
                    <RadioMusicUpload
                      disabled={loading}
                      onUploadComplete={async (url, title, duration) => {
                        await addTrack(
                          selectedPlaylist.id,
                          title,
                          url,
                          "Admin Upload",
                          duration,
                          "admin_upload"
                        );
                        loadData();
                      }}
                    />

                    <ScrollArea className="h-[250px]">
                      {selectedPlaylist.tracks.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No tracks in this playlist
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedPlaylist.tracks.map((track, index) => {
                            const isCurrentTrack = localTrack?.url === track.audio_url;
                            return (
                              <div
                                key={track.id}
                                className={`flex items-center gap-3 p-2 rounded hover:bg-muted/10 ${
                                  isCurrentTrack ? "bg-gold/10 border border-gold/30" : ""
                                }`}
                              >
                                <span className="w-6 text-center text-sm text-muted-foreground">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate text-sm ${isCurrentTrack ? "text-gold" : ""}`}>
                                    {track.title}
                                  </p>
                                  {track.artist && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {track.artist}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Preview (Local Play) */}
                                  <Button
                                    variant={isCurrentTrack && localPlaying ? "default" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isCurrentTrack && localPlaying) {
                                        toggleLocalPlay();
                                      } else {
                                        handleLocalPlay(track.title, track.audio_url, track.artist || undefined, index);
                                      }
                                    }}
                                    title={isCurrentTrack && localPlaying ? "Pause Preview" : "Preview Track"}
                                  >
                                    {isCurrentTrack && localPlaying ? (
                                      <Pause className="w-4 h-4 text-gold" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </Button>
                                  {/* Stream to All Users (Set Now Playing) */}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-gold/30 hover:bg-gold/20"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleSetNowPlaying(track.title, track.audio_url, track.artist || undefined);
                                      toast.success(`Now streaming "${track.title}" to all users!`);
                                    }}
                                    title="Stream to All Users"
                                  >
                                    <Radio className="w-4 h-4 text-gold" />
                                  </Button>
                                  {/* Delete */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTrack(track.id);
                                    }}
                                    title="Delete Track"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <ListMusic className="w-12 h-12 mb-4 opacity-50" />
                    <p>Select a playlist to manage tracks</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Now Playing Tab */}
          <TabsContent value="now-playing" className="space-y-4">
            <Card className="bg-gradient-to-r from-gold/10 to-transparent border-gold/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold/30 to-amber-600/30 flex items-center justify-center">
                    <Radio className="w-8 h-8 text-gold animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gold font-medium uppercase tracking-wider mb-1">
                      Currently Playing
                    </p>
                    {currentNowPlaying ? (
                      <>
                        <h3 className="text-xl font-semibold">{currentNowPlaying.track_title}</h3>
                        {currentNowPlaying.artist && (
                          <p className="text-muted-foreground">{currentNowPlaying.artist}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No track is currently set as Now Playing</p>
                    )}
                  </div>
                  {currentNowPlaying && (
                    <Button variant="outline" onClick={handleClearNowPlaying}>
                      Clear Now Playing
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground space-y-2 p-4 bg-muted/10 rounded-lg">
              <p><strong>How to stream:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Stream Playlist</strong> - Click to start streaming the first track to all users</li>
                <li><strong>Preview</strong> (play icon) - Listen to a track locally without broadcasting</li>
                <li><strong>Stream</strong> (radio icon) - Click next to any track to broadcast it to all users</li>
              </ul>
              <p className="text-gold">All users will see "Now Streaming" and hear this track in their Radio Player.</p>
            </div>
          </TabsContent>

          {/* Streams / Podcasts Tab */}
          <TabsContent value="streams" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Podcasts & Live Streams</h3>
                <p className="text-sm text-muted-foreground">
                  Add external podcast feeds or live stream URLs
                </p>
              </div>
              <Dialog open={showAddStreamDialog} onOpenChange={setShowAddStreamDialog}>
                <DialogTrigger asChild>
                  <Button variant="gold" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stream
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Podcast or Live Stream</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={newStreamName}
                        onChange={(e) => setNewStreamName(e.target.value)}
                        placeholder="e.g., Director's Daily Podcast"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newStreamType} onValueChange={setNewStreamType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="podcast">Podcast Feed</SelectItem>
                          <SelectItem value="livestream">Live Stream</SelectItem>
                          <SelectItem value="external">External Audio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Stream URL *</Label>
                      <Input
                        value={newStreamUrl}
                        onChange={(e) => setNewStreamUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Direct audio URL, podcast RSS feed, or live stream endpoint
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newStreamDescription}
                        onChange={(e) => setNewStreamDescription(e.target.value)}
                        placeholder="Brief description..."
                      />
                    </div>
                    <Button onClick={handleAddStream} disabled={loading} className="w-full">
                      <Link className="w-4 h-4 mr-2" />
                      Add Stream
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {streams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No streams or podcasts added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {streams.map((stream) => (
                    <div
                      key={stream.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/10 group"
                    >
                      <div className="w-10 h-10 rounded bg-muted/20 flex items-center justify-center">
                        {stream.source_type === "podcast" ? (
                          <Podcast className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Radio className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{stream.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {stream.source_type}
                          </Badge>
                        </div>
                        {stream.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {stream.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePlayStream(stream)}
                          title="Set as Now Playing"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(stream.stream_url || "", "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteStream(stream.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">User Submissions</h3>
                <p className="text-sm text-muted-foreground">
                  Review and approve user-submitted tracks for Director Radio
                </p>
              </div>
              {selectedPlaylist && (
                <Badge variant="secondary">
                  Adding to: {selectedPlaylist.name}
                </Badge>
              )}
            </div>

            {!selectedPlaylist && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                <p className="text-sm text-amber-500">
                  ⚠️ Select a playlist from the Playlists tab to approve submissions
                </p>
              </div>
            )}

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {submissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No submissions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        submission.status === "pending" 
                          ? "border-amber-500/30 bg-amber-500/5" 
                          : submission.status === "approved"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <div className="w-10 h-10 rounded bg-muted/20 flex items-center justify-center">
                        {submission.status === "pending" ? (
                          <Clock className="w-5 h-5 text-amber-500" />
                        ) : submission.status === "approved" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{submission.track_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.artist_name || "Anonymous"} • {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(submission.audio_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {submission.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveSubmission(submission)}
                              disabled={!selectedPlaylist}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectSubmission(submission.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Badge variant={
                          submission.status === "pending" ? "secondary" :
                          submission.status === "approved" ? "default" : "destructive"
                        }>
                          {submission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* User Audio Tab */}
          <TabsContent value="user-audio" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">User-Generated Audio</h3>
                <p className="text-sm text-muted-foreground">
                  Soundtracks created by users that you can add to playlists
                </p>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {userAudio.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No user-generated audio available
                </p>
              ) : (
                <div className="space-y-2">
                  {userAudio.map((audio) => (
                    <div
                      key={audio.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/10 group"
                    >
                      <div className="w-10 h-10 rounded bg-muted/20 flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {audio.prompt?.substring(0, 50) || "Generated Track"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(audio.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(audio.media_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {selectedPlaylist && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddUserAudioToPlaylist(audio)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add to {selectedPlaylist.name}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {!selectedPlaylist && (
              <p className="text-sm text-muted-foreground text-center">
                Select a playlist from the Playlists tab to add user audio to it
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
