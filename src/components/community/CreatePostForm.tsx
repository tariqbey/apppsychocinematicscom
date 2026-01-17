import { useState, useRef } from "react";
import { Lightbulb, Trophy, Sparkles, HelpCircle, Send, Loader2, Image, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface CreatePostFormProps {
  onSubmit: (content: string, postType: string, mediaUrl?: string, mediaType?: string) => Promise<boolean>;
}

const POST_TYPES = [
  { id: "insight", label: "Insight", icon: Lightbulb, description: "Share a realization" },
  { id: "win", label: "Win", icon: Trophy, description: "Celebrate a victory" },
  { id: "manifestation", label: "Manifestation", icon: Sparkles, description: "Share what you're creating" },
  { id: "question", label: "Question", icon: HelpCircle, description: "Ask the community" },
];

export function CreatePostForm({ onSubmit }: CreatePostFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("insight");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for images
    if (file.size > maxSize) {
      toast.error(`File must be less than ${isVideo ? "100MB" : "10MB"}`);
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? "image" : "video");
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = mediaFile.name.split(".").pop();
      const fileName = `${user.id}/post-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(fileName, mediaFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("community-media")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("Failed to upload media");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) return;

    setIsSubmitting(true);
    
    let uploadedMediaUrl: string | undefined;
    if (mediaFile) {
      const url = await uploadMedia();
      if (url) {
        uploadedMediaUrl = url;
      } else if (mediaFile) {
        setIsSubmitting(false);
        return;
      }
    }

    const success = await onSubmit(content.trim(), postType, uploadedMediaUrl, mediaType || undefined);
    if (success) {
      setContent("");
      setPostType("insight");
      clearMedia();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="glass-card p-5 cinematic-border space-y-4">
      <div className="flex items-center gap-2 text-gold">
        <Sparkles className="h-5 w-5" />
        <h3 className="font-display text-lg">Share with the Community</h3>
      </div>

      <Textarea
        placeholder="What's on your mind, Director? Share your insights, wins, or questions..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] bg-secondary/50 resize-none"
      />

      {/* Media Preview */}
      {mediaPreview && (
        <div className="relative inline-block">
          {mediaType === "image" ? (
            <img 
              src={mediaPreview} 
              alt="Preview" 
              className="max-h-48 rounded-lg object-cover"
            />
          ) : (
            <video 
              src={mediaPreview} 
              className="max-h-48 rounded-lg"
              controls
            />
          )}
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={clearMedia}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {POST_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setPostType(type.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                postType === type.id
                  ? "bg-gold/20 border-gold text-gold"
                  : "bg-secondary/50 border-border text-muted-foreground hover:border-gold/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Image className="h-4 w-4" />
          Photo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Video className="h-4 w-4" />
          Video
        </Button>
      </div>

      <Button
        variant="gold"
        className="w-full"
        onClick={handleSubmit}
        disabled={(!content.trim() && !mediaFile) || isSubmitting || uploading}
      >
        {isSubmitting || uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {uploading ? "Uploading..." : "Sharing..."}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Share Post
          </>
        )}
      </Button>
    </div>
  );
}
