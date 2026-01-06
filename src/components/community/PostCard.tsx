import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    post_type: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    display_name?: string;
    avatar_url?: string;
    media_url?: string;
    media_type?: string;
  };
  isLiked: boolean;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onFetchComments: (postId: string) => Promise<Comment[]>;
  onAddComment: (postId: string, content: string) => Promise<boolean>;
}

const POST_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  insight: { label: "💡 Insight", color: "bg-blue-500/20 text-blue-300" },
  win: { label: "🏆 Win", color: "bg-gold/20 text-gold" },
  manifestation: { label: "✨ Manifestation", color: "bg-purple-500/20 text-purple-300" },
  question: { label: "❓ Question", color: "bg-emerald-500/20 text-emerald-300" },
};

export function PostCard({
  post,
  isLiked,
  onLike,
  onDelete,
  onFetchComments,
  onAddComment,
}: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwner = user?.id === post.user_id;
  const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.insight;

  const handleToggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const fetchedComments = await onFetchComments(post.id);
      setComments(fetchedComments);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const success = await onAddComment(post.id, newComment.trim());
    if (success) {
      setNewComment("");
      // Refresh comments
      const fetchedComments = await onFetchComments(post.id);
      setComments(fetchedComments);
    }
    setSubmittingComment(false);
  };

  return (
    <div className="glass-card p-5 cinematic-border space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-gold/30">
            <AvatarImage src={post.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-gold/30 to-amber-soft/30 text-gold font-display text-lg">
              {post.display_name?.charAt(0).toUpperCase() || "D"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{post.display_name || "Anonymous Director"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs px-2 py-1 rounded-full", typeStyle.color)}>
            {typeStyle.label}
          </span>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="rounded-lg overflow-hidden">
          {post.media_type === "image" ? (
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="w-full max-h-96 object-cover"
            />
          ) : post.media_type === "video" ? (
            <video 
              src={post.media_url} 
              className="w-full max-h-96"
              controls
            />
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
        <button
          onClick={() => onLike(post.id)}
          className={cn(
            "flex items-center gap-1.5 text-sm transition-colors",
            isLiked ? "text-cinematic-red" : "text-muted-foreground hover:text-cinematic-red"
          )}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          <span>{post.likes_count}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments_count}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-3 pt-3 border-t border-border/50">
          {loadingComments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No comments yet. Be the first!
                </p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={comment.avatar_url} />
                        <AvatarFallback className="bg-secondary text-xs font-medium">
                          {comment.display_name?.charAt(0).toUpperCase() || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-secondary/50 rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{comment.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              {user && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    className="bg-secondary/50 text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
