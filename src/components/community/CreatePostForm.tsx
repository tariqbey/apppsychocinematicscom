import { useState } from "react";
import { Lightbulb, Trophy, Sparkles, HelpCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CreatePostFormProps {
  onSubmit: (content: string, postType: string) => Promise<boolean>;
}

const POST_TYPES = [
  { id: "insight", label: "Insight", icon: Lightbulb, description: "Share a realization" },
  { id: "win", label: "Win", icon: Trophy, description: "Celebrate a victory" },
  { id: "manifestation", label: "Manifestation", icon: Sparkles, description: "Share what you're creating" },
  { id: "question", label: "Question", icon: HelpCircle, description: "Ask the community" },
];

export function CreatePostForm({ onSubmit }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("insight");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit(content.trim(), postType);
    if (success) {
      setContent("");
      setPostType("insight");
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

      <Button
        variant="gold"
        className="w-full"
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sharing...
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
