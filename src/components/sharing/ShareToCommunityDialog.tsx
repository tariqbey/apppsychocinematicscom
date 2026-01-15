import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ShareToCommunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "image" | "video" | "audio";
  defaultCaption?: string;
}

const POST_TYPES = [
  { id: "manifestation", label: "Manifestation", icon: "✨", description: "Share what you're creating" },
  { id: "win", label: "Win", icon: "🏆", description: "Celebrate your creation" },
  { id: "insight", label: "Insight", icon: "💡", description: "Share a realization" },
];

export function ShareToCommunityDialog({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  defaultCaption = "",
}: ShareToCommunityDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [caption, setCaption] = useState(defaultCaption);
  const [postType, setPostType] = useState("manifestation");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share to the community.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('director_posts')
        .insert({
          user_id: user.id,
          content: caption.trim() || "Check out my latest creation! ✨",
          post_type: postType,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (error) throw error;

      toast({
        title: "Shared to Community!",
        description: "Your creation is now live in the Director's Corner.",
      });
      
      onClose();
      setCaption("");
      setPostType("manifestation");
    } catch (error) {
      console.error("Error sharing to community:", error);
      toast({
        title: "Share failed",
        description: "Unable to share to community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            Share to Director's Corner
          </DialogTitle>
          <DialogDescription>
            Share your AI-generated creation with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Media Preview */}
          <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
            {mediaType === "image" ? (
              <img src={mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
            ) : mediaType === "video" ? (
              <video src={mediaUrl} className="max-w-full max-h-full" controls />
            ) : (
              <audio src={mediaUrl} controls className="w-full" />
            )}
          </div>

          {/* Post Type Selection */}
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setPostType(type.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                  postType === type.id
                    ? "bg-gold/20 border-gold text-gold"
                    : "bg-muted border-border text-muted-foreground hover:border-gold/50"
                )}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Caption */}
          <Textarea
            placeholder="Add a caption... Share your thoughts, process, or what this creation means to you."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Share
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
