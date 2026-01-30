import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Music, Loader2, X, Check, ImageIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrackData {
  file: File;
  title: string;
  artist: string;
  albumName: string;
  albumCoverUrl: string;
  uploading: boolean;
  uploaded: boolean;
  progress: number;
  audioUrl?: string;
  duration?: number;
}

interface BulkTrackUploadProps {
  playlistId: string;
  onUploadComplete: () => void;
  disabled?: boolean;
}

export function BulkTrackUpload({ playlistId, onUploadComplete, disabled }: BulkTrackUploadProps) {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAudioDuration = (file: File): Promise<number | undefined> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
      };
      audio.onerror = () => resolve(undefined);
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: TrackData[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith("audio/")) {
        toast.error(`${file.name} is not an audio file`);
        continue;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        continue;
      }

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      newTracks.push({
        file,
        title: nameWithoutExt,
        artist: "",
        albumName: "",
        albumCoverUrl: "",
        uploading: false,
        uploaded: false,
        progress: 0,
      });
    }

    setTracks(prev => [...prev, ...newTracks]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateTrack = (index: number, updates: Partial<TrackData>) => {
    setTracks(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const removeTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAllTracks = async () => {
    if (tracks.length === 0) return;

    setIsUploading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const userId = sessionData.session?.user?.id;

    if (!token || !userId) {
      toast.error("You must be logged in to upload");
      setIsUploading(false);
      return;
    }

    let successCount = 0;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (track.uploaded) continue;

      updateTrack(i, { uploading: true, progress: 10 });

      try {
        // Get duration
        const duration = await getAudioDuration(track.file);
        updateTrack(i, { progress: 20, duration });

        // Upload file
        const fileExt = track.file.name.split(".").pop();
        const fileName = `radio-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/radio/${fileName}`;

        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        const uploadUrl = `${projectUrl}/storage/v1/object/generated-media/${filePath}`;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = 20 + (event.loaded / event.total) * 60;
              updateTrack(i, { progress: Math.round(percentComplete) });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));

          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("x-upsert", "true");
          xhr.send(track.file);
        });

        updateTrack(i, { progress: 85 });

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("generated-media")
          .getPublicUrl(filePath);

        // Get current max order for playlist
        const { data: existingTracks } = await supabase
          .from("radio_playlist_tracks")
          .select("track_order")
          .eq("playlist_id", playlistId)
          .order("track_order", { ascending: false })
          .limit(1);

        const nextOrder = existingTracks && existingTracks.length > 0 
          ? existingTracks[0].track_order + 1 + i
          : i;

        // Insert track to database
        const { error: insertError } = await supabase
          .from("radio_playlist_tracks")
          .insert({
            playlist_id: playlistId,
            title: track.title,
            audio_url: publicUrl,
            artist: track.artist || null,
            album_name: track.albumName || null,
            album_cover_url: track.albumCoverUrl || null,
            duration_seconds: duration || null,
            track_order: nextOrder,
            source_type: 'admin_upload',
          });

        if (insertError) throw insertError;

        updateTrack(i, { progress: 100, uploading: false, uploaded: true, audioUrl: publicUrl });
        successCount++;
      } catch (error) {
        console.error(`Error uploading ${track.title}:`, error);
        updateTrack(i, { uploading: false, progress: 0 });
        toast.error(`Failed to upload: ${track.title}`);
      }
    }

    setIsUploading(false);
    
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} track${successCount > 1 ? 's' : ''}`);
      onUploadComplete();
    }
  };

  const pendingCount = tracks.filter(t => !t.uploaded).length;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-gold" />
          <Label className="text-base font-medium">Bulk Upload Tracks</Label>
        </div>
        {tracks.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {tracks.filter(t => t.uploaded).length}/{tracks.length} uploaded
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleFilesSelect}
        disabled={isUploading || disabled}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full h-16 border-dashed border-2 hover:border-gold/50 hover:bg-gold/5"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || disabled}
      >
        <div className="flex flex-col items-center gap-1">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click to select multiple audio files
          </span>
        </div>
      </Button>

      {tracks.length > 0 && (
        <>
          <ScrollArea className="h-64">
            <div className="space-y-3 pr-4">
              {tracks.map((track, index) => (
                <Card key={index} className={`${track.uploaded ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gold/20 flex items-center justify-center flex-shrink-0">
                        {track.uploaded ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : track.uploading ? (
                          <Loader2 className="w-5 h-5 text-gold animate-spin" />
                        ) : (
                          <Music className="w-5 h-5 text-gold" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(track.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      {!track.uploaded && !track.uploading && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeTrack(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {!track.uploaded && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Track Title</Label>
                          <Input
                            value={track.title}
                            onChange={(e) => updateTrack(index, { title: e.target.value })}
                            placeholder="Title"
                            className="h-8 text-sm"
                            disabled={track.uploading}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Artist</Label>
                          <Input
                            value={track.artist}
                            onChange={(e) => updateTrack(index, { artist: e.target.value })}
                            placeholder="Artist name"
                            className="h-8 text-sm"
                            disabled={track.uploading}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Album Name</Label>
                          <Input
                            value={track.albumName}
                            onChange={(e) => updateTrack(index, { albumName: e.target.value })}
                            placeholder="Album"
                            className="h-8 text-sm"
                            disabled={track.uploading}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Cover URL</Label>
                          <Input
                            value={track.albumCoverUrl}
                            onChange={(e) => updateTrack(index, { albumCoverUrl: e.target.value })}
                            placeholder="https://..."
                            className="h-8 text-sm"
                            disabled={track.uploading}
                          />
                        </div>
                      </div>
                    )}

                    {track.uploading && (
                      <Progress value={track.progress} className="h-1.5" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Button
            onClick={uploadAllTracks}
            disabled={isUploading || pendingCount === 0}
            className="w-full"
            variant="gold"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingCount} Track{pendingCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Supported formats: MP3, WAV, AAC, FLAC • Max size: 50MB per file
      </p>
    </div>
  );
}
