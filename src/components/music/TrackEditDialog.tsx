import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music, User, Disc, Image, Sparkles, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TrackEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title: string;
    artist: string | null;
    album_name?: string | null;
    album_cover_url?: string | null;
    metadata?: Record<string, any>;
  } | null;
  tableName: 'user_playlist_tracks' | 'radio_playlist_tracks' | 'radio_featured_tracks';
  onSave?: () => void;
}

export function TrackEditDialog({
  open,
  onOpenChange,
  track,
  tableName,
  onSave,
}: TrackEditDialogProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [albumCoverUrl, setAlbumCoverUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);

  // Reset form when track changes
  useEffect(() => {
    if (track) {
      setTitle(track.title || "");
      setArtist(track.artist || "");
      setAlbumName(track.album_name || "");
      setAlbumCoverUrl(track.album_cover_url || "");
    }
  }, [track]);

  const handleGenerateAlbumArt = async () => {
    if (!title.trim()) {
      toast.error("Please enter a track title first");
      return;
    }

    setIsGeneratingArt(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate album art");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-album-art", {
        body: {
          trackTitle: title,
          artistName: artist,
          albumName: albumName,
          style: "cinematic, professional album artwork, dramatic lighting",
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Insufficient credits")) {
          toast.error("Not enough credits. Purchase more to generate album art.");
        } else {
          throw new Error(data.error);
        }
        return;
      }

      if (data?.album_cover_url) {
        setAlbumCoverUrl(data.album_cover_url);
        toast.success(`Album art generated! (${data.credits_used} credits used)`);
      }
    } catch (error) {
      console.error("Error generating album art:", error);
      toast.error("Failed to generate album art");
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const handleSave = async () => {
    if (!track) return;

    setIsSaving(true);
    try {
      const updates = {
        title,
        artist: artist || null,
        album_name: albumName || null,
        album_cover_url: albumCoverUrl || null,
      };

      // Handle different table structures
      if (tableName === 'radio_featured_tracks') {
        const { error } = await supabase
          .from('radio_featured_tracks')
          .update({ 
            track_title: title,
            artist: artist || null,
            album_name: albumName || null,
            album_cover_url: albumCoverUrl || null,
          })
          .eq('id', track.id);

        if (error) throw error;
      } else if (tableName === 'radio_playlist_tracks') {
        const { error } = await supabase
          .from('radio_playlist_tracks')
          .update(updates)
          .eq('id', track.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_playlist_tracks')
          .update(updates)
          .eq('id', track.id);

        if (error) throw error;
      }

      toast.success("Track updated successfully");
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error("Error updating track:", error);
      toast.error("Failed to update track");
    } finally {
      setIsSaving(false);
    }
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-gold" />
            Edit Track
          </DialogTitle>
          <DialogDescription>
            Update track details and album artwork.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Album Cover Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 rounded-lg">
              <AvatarImage src={albumCoverUrl} alt="Album cover" className="object-cover" />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/10">
                <Image className="w-8 h-8 text-gold/50" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Album Cover</Label>
              <div className="flex gap-2">
                <Input
                  value={albumCoverUrl}
                  onChange={(e) => setAlbumCoverUrl(e.target.value)}
                  placeholder="Paste image URL or generate"
                  className="flex-1 text-xs"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={handleGenerateAlbumArt}
                  disabled={isGeneratingArt}
                  className="gap-1"
                >
                  {isGeneratingArt ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-gold" />
                  )}
                  <span className="hidden sm:inline">AI Generate</span>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">13 credits to generate</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Disc className="w-4 h-4" />
              Track Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter track title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="artist" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Artist Name
            </Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="album" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Album Name
            </Label>
            <Input
              id="album"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Enter album name (optional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title.trim()}
            variant="gold"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
