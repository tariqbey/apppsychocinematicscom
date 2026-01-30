import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Music, Share2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShareTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    title: string;
    artist?: string | null;
    audio_url: string;
    album_cover_url?: string | null;
  };
}

export function ShareTrackDialog({ open, onOpenChange, track }: ShareTrackDialogProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(`🎵 Check out my track: "${track.title}"${track.artist ? ` by ${track.artist}` : ''}`);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!user) {
      toast.error("You must be logged in to share");
      return;
    }

    if (!content.trim()) {
      toast.error("Please add a message");
      return;
    }

    setIsSharing(true);

    try {
      const { error } = await supabase
        .from("director_posts")
        .insert({
          user_id: user.id,
          content: content.trim(),
          post_type: "music",
          media_url: track.audio_url,
          media_type: "audio",
          visibility: "public",
        });

      if (error) throw error;

      toast.success("Track shared to Director's Corner!");
      onOpenChange(false);
      setContent("");
    } catch (error) {
      console.error("Error sharing track:", error);
      toast.error("Failed to share track");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-gold" />
            Share Track to Community
          </DialogTitle>
          <DialogDescription>
            Share this track with other Directors in the community feed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Track Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-12 h-12 rounded bg-gold/20 flex items-center justify-center flex-shrink-0">
              {track.album_cover_url ? (
                <img 
                  src={track.album_cover_url} 
                  alt={track.title}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Music className="w-6 h-6 text-gold" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist || 'AI Generated'}
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Your Message</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to say about this track?"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/500
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="gold" 
              onClick={handleShare} 
              disabled={isSharing || !content.trim()}
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
