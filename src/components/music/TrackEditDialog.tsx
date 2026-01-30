import { useState } from "react";
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
import { Music, User, Disc } from "lucide-react";

interface TrackEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title: string;
    artist: string | null;
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
  const [title, setTitle] = useState(track?.title || "");
  const [artist, setArtist] = useState(track?.artist || "");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when track changes
  useState(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist || "");
    }
  });

  const handleSave = async () => {
    if (!track) return;

    setIsSaving(true);
    try {
      // Handle different table structures
      if (tableName === 'radio_featured_tracks') {
        const { error } = await supabase
          .from('radio_featured_tracks')
          .update({ 
            track_title: title,
            artist: artist || null,
          })
          .eq('id', track.id);

        if (error) throw error;
      } else if (tableName === 'radio_playlist_tracks') {
        const { error } = await supabase
          .from('radio_playlist_tracks')
          .update({ 
            title,
            artist: artist || null,
          })
          .eq('id', track.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_playlist_tracks')
          .update({ 
            title,
            artist: artist || null,
          })
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-gold" />
            Edit Track
          </DialogTitle>
          <DialogDescription>
            Update the track title and artist information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
