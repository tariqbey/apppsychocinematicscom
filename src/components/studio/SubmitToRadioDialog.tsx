import { useState } from "react";
import { Radio, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SubmitToRadioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  mediaUrl: string;
  defaultTitle?: string;
}

export function SubmitToRadioDialog({
  isOpen,
  onClose,
  mediaId,
  mediaUrl,
  defaultTitle = "",
}: SubmitToRadioDialogProps) {
  const { user } = useAuth();
  const [trackTitle, setTrackTitle] = useState(defaultTitle.slice(0, 50) || "My Soundtrack");
  const [artistName, setArtistName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit");
      return;
    }

    if (!trackTitle.trim()) {
      toast.error("Please enter a track title");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("radio_submissions").insert({
        user_id: user.id,
        media_id: mediaId,
        track_title: trackTitle.trim(),
        artist_name: artistName.trim() || null,
        audio_url: mediaUrl,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Submitted to Director Radio!", {
        description: "Your track is pending admin review.",
      });
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit track");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-gold" />
            Submit to Director Radio
          </DialogTitle>
          <DialogDescription>
            Request your soundtrack to be featured on Director Radio. An admin will review your submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="track-title">Track Title *</Label>
            <Input
              id="track-title"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="Enter track title"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist-name">Artist Name (optional)</Label>
            <Input
              id="artist-name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist name or alias"
              maxLength={100}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 rounded bg-gold/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{trackTitle || "Track Title"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {artistName || "Anonymous Director"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
